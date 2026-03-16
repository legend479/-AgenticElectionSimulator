import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SimulationResult, FullSimulationConfig, SimulationSettings, AgentDecision, RepresentativeAgentData, ModelType, NudgeType, UtilityVizData, DDMVizData, DualSystemVizData, EditableNudgeParams } from '../../types';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import UtilityViz from '../visualizations/UtilityViz';
import DDMViz from '../visualizations/DDMViz';
import DualSystemViz from '../visualizations/DualSystemViz';

// --- VIZ DATA GENERATION LOGIC ---
// This logic is moved here from simulationService to allow for dynamic, client-side generation.

const logistic = (x: number) => 1 / (1 + Math.exp(-x));

const generateUtilityVizData = (agent: AgentDecision, config: FullSimulationConfig, settings: SimulationSettings): UtilityVizData => {
    const context = config.globalContext;
    const params = config.modelPhysics.utility;
    const { beta_pB, beta_C, beta_D, beta_S, beta_H } = params;

    const B = agent.issue_salience * agent.partisan_identity_strength * agent.personality_match_candidate;
    const p_i = context.electoral_competitiveness * (1 + 0.2 * agent.overconfidence);
    const pB_val = p_i * B;
    
    let C_val = context.voting_cost_total * (1 - 0.4 * agent.education_normalized) * (1 + 0.3 * agent.risk_aversion);
    let D_val = agent.civic_duty;

    if(settings.nudge === NudgeType.Implementation) C_val *= (1 - settings.nudgeParams[NudgeType.Implementation].cost_reduction);
    if(settings.nudge === NudgeType.IdentityFrame) D_val *= (1 + settings.nudgeParams[NudgeType.IdentityFrame].strength * 0.2);

    const utilityComponents: {[key: string]: number} = {
        pB: pB_val * beta_pB,
        C: C_val * beta_C,
        D: D_val * beta_D,
        S: agent.social_pressure_sensitivity * beta_S,
        H: agent.habit_strength * beta_H,
    };
    
    let finalUtility = Object.values(utilityComponents).reduce((a, b) => a + b, 0);

    if(settings.nudge === NudgeType.Monetary) {
        const nudge = settings.nudgeParams[NudgeType.Monetary];
        const nudgeValue = nudge.lottery_probability * nudge.lottery_value / (1 + agent.civic_duty);
        utilityComponents['Nudge'] = nudgeValue;
        finalUtility += nudgeValue;
    }

    return {
        model: ModelType.Utility,
        components: Object.entries(utilityComponents).map(([name, value]) => ({ name, value })),
        finalUtility,
        voteProb: agent.voteProb,
    };
};

const generateDDMVizData = (agent: AgentDecision, config: FullSimulationConfig, settings: SimulationSettings): DDMVizData => {
    const context = config.globalContext;
    const params = config.modelPhysics.ddm;
    const { beta_D, beta_H, beta_S, beta_C, beta_pB, beta_OC } = params;
    
    let a = params.threshold_a * (1 + 0.4 * agent.risk_aversion) * (1 - 0.3 * agent.education_normalized);
    const bias = 0.2 * agent.habit_strength + 0.1 * (agent.partisan_identity_strength - 0.5);
    let z = a * (0.5 + bias);
    let sigma = params.noise * (1 + 0.3 * (1 - agent.education_normalized));
    
    const B = agent.issue_salience * agent.partisan_identity_strength;
    const pB_val = context.electoral_competitiveness * B;

    let mu = params.base_mu +
        (agent.civic_duty * beta_D) +
        (agent.habit_strength * beta_H) +
        (agent.social_pressure_sensitivity * beta_S) +
        (pB_val * beta_pB) +
        (agent.overconfidence * beta_OC) +
        (context.voting_cost_total * beta_C);

    if (settings.nudge === NudgeType.Implementation) {
         a *= (1 - settings.nudgeParams[NudgeType.Implementation].cost_reduction);
         z += settings.nudgeParams[NudgeType.Implementation].habit_boost * a;
    }
    if (settings.nudge === NudgeType.SocialNorm) {
        mu += beta_S * 0.5 * (settings.nudgeParams[NudgeType.SocialNorm].revealed_turnout - 0.5);
    }
    
    const generatePath = (max_steps = 200, dt = 0.05) => {
        const path = [{ t: 0, x: z }];
        let x = z;
        for (let i = 1; i < max_steps && x > 0 && x < a; i++) {
            const dW = (Math.random() - 0.5) * Math.sqrt(12 * dt); // Approx normal
            x += mu * dt + sigma * dW;
            // Round time to 2 decimals to avoid floating point ugliness in viz
            path.push({ t: parseFloat((i * dt).toFixed(2)), x });
        }
        return path;
    };

    return {
        model: ModelType.DDM,
        params: { mu, a, z, sigma },
        paths: Array(5).fill(0).map(() => generatePath()),
    };
};

const generateDualSystemVizData = (agent: AgentDecision, config: FullSimulationConfig, settings: SimulationSettings): DualSystemVizData => {
    const context = config.globalContext;
    const params = config.modelPhysics.dual_system;
    
    // System 1: Heuristic
    const s1_components: {[key: string]: number} = {
        Baseline: params.h_momentum,
        Habit: params.h_habit * agent.habit_strength,
        Social: params.h_social * agent.social_pressure_sensitivity,
        Affect: params.h_affect * (agent.affect || 0),
    };
    
    let s1_act = Object.values(s1_components).reduce((a, b) => a + b, 0);
    // Interaction term viz
    const interaction = 0.5 * (agent.habit_strength * agent.social_pressure_sensitivity);
    s1_components['Synergy'] = interaction;
    s1_act += interaction;

    if (settings.nudge === NudgeType.SocialNorm) {
         const nudgeVal = params.h_social * 0.5 * (settings.nudgeParams[NudgeType.SocialNorm].revealed_turnout - 0.5);
         s1_components['Nudge'] = nudgeVal;
         s1_act += nudgeVal;
    }

    const p_vote_s1 = logistic(s1_act - 0.5);
    
    // System 2: Utility
    const B = agent.issue_salience * agent.partisan_identity_strength;
    const P = context.electoral_competitiveness;
    
    const s2_components = {
        'P*B (Benefit)': params.u_pB * P * B,
        'Civic Duty': params.u_duty * agent.civic_duty,
        'Cost': params.u_cost * context.voting_cost_total,
    };
    let s2_util = Object.values(s2_components).reduce((a, b) => a + b, 0);
    const p_vote_s2 = logistic(s2_util);

    // Arbiter
    const lambda_weight = Math.min(1, Math.max(0, params.lambda_base + params.lambda_edu_factor * agent.education_normalized + params.lambda_risk_factor * agent.risk_aversion));

    return {
        model: ModelType.DualSystem,
        p_vote_s1, p_vote_s2, lambda: lambda_weight, final_p_vote: agent.voteProb,
        s1_components: Object.entries(s1_components).map(([name, value]) => ({ name, value })),
        s2_components: Object.entries(s2_components).map(([name, value]) => ({ name, value })),
    };
};

// --- COMPONENT ---

interface DecisionInspectorProps {
  result: SimulationResult;
  config: FullSimulationConfig;
  settings: Omit<SimulationSettings, 'nudgeParams'>;
  nudgeParams: EditableNudgeParams;
}

const AgentAttribute: React.FC<{label: string, value: number, isPercent?: boolean}> = ({ label, value, isPercent }) => (
    <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-200">{isPercent ? `${(value * 100).toFixed(1)}%` : value.toFixed(2)}</p>
    </div>
);


const DecisionInspector: React.FC<DecisionInspectorProps> = ({ result, config, settings, nudgeParams }) => {
    const { agents } = result;
    const { model: selectedModel } = settings;

    const [selectedAgent, setSelectedAgent] = useState<AgentDecision | null>(null);
    const [vizData, setVizData] = useState<RepresentativeAgentData | null>(null);

    const chartData = useMemo(() => agents.map(agent => ({
        x: agent.civic_duty,
        y: agent.voteProb,
        id: agent.id,
    })), [agents]);

    const handleAgentSelect = useCallback((data: any) => {
        if (data && data.payload) {
            const agent = agents.find(a => a.id === data.payload.id);
            if (agent) setSelectedAgent(agent);
        }
    }, [agents]);

    useEffect(() => {
        if (agents.length > 0 && !selectedAgent) {
            setSelectedAgent(agents[0]);
        }
    }, [agents, selectedAgent]);

    useEffect(() => {
        if (selectedAgent) {
            const fullSettings: SimulationSettings = { ...settings, nudgeParams };
            switch (selectedModel) {
                case ModelType.Utility:
                    setVizData(generateUtilityVizData(selectedAgent, config, fullSettings));
                    break;
                case ModelType.DDM:
                    setVizData(generateDDMVizData(selectedAgent, config, fullSettings));
                    break;
                case ModelType.DualSystem:
                    setVizData(generateDualSystemVizData(selectedAgent, config, fullSettings));
                    break;
                default:
                    setVizData(null);
            }
        }
    }, [selectedAgent, selectedModel, config, settings, nudgeParams]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center">
                <h3 className="text-xl font-black text-white mb-2 tracking-tighter uppercase">Decision Inspector</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">Select an agent from the population map to analyze their internal cognitive process.</p>
            </div>
            
            <div className="h-40 w-full bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50">
                <ResponsiveContainer>
                    <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.1} vertical={false} />
                        <XAxis type="number" dataKey="x" name="Civic Duty" domain={[0, 1]} hide />
                        <YAxis type="number" dataKey="y" name="Vote Probability" domain={[0, 1]} hide />
                        <Tooltip
                            cursor={{ stroke: '#334155', strokeDasharray: '3 3' }}
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '0.75rem', backdropFilter: 'blur(8px)' }}
                            itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                            labelStyle={{ display: 'none' }}
                            formatter={(value: number) => value.toFixed(2)}
                        />
                        <Scatter data={chartData} onClick={handleAgentSelect} className="cursor-pointer">
                            {chartData.map((entry) => (
                                <Cell key={`cell-${entry.id}`} fill={selectedAgent?.id === entry.id ? '#f59e0b' : '#0ea5e9'} opacity={selectedAgent?.id === entry.id ? 1 : 0.2} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            {selectedAgent && vizData && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-6xl font-black italic">#{selectedAgent.id}</span>
                            </div>
                            
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Agent Profile</h4>
                                
                                <div className="flex items-end justify-between mb-8">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedAgent.voted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                            {selectedAgent.voted ? "Voted" : "Abstained"}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vote Prob</p>
                                        <p className="text-3xl font-black text-white tracking-tighter">{(selectedAgent.voteProb * 100).toFixed(1)}%</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <AgentAttribute label="Civic Duty" value={selectedAgent.civic_duty} />
                                    <AgentAttribute label="Habit" value={selectedAgent.habit_strength} />
                                    <AgentAttribute label="Education" value={selectedAgent.education_normalized} />
                                    <AgentAttribute label="Partisan" value={selectedAgent.partisan_identity_strength} />
                                    <AgentAttribute label="Risk" value={selectedAgent.risk_aversion} />
                                    <AgentAttribute label="Social" value={selectedAgent.social_pressure_sensitivity} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-8 bg-slate-900/20 rounded-2xl border border-slate-800/30 p-6">
                        <div className="mb-6">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Cognitive Model Visualization</h4>
                            <p className="text-xs text-slate-400">Detailed breakdown of the {selectedModel.replace('_', ' ')} model parameters for this agent.</p>
                        </div>
                        {vizData.model === ModelType.Utility && <UtilityViz data={vizData} />}
                        {vizData.model === ModelType.DDM && <DDMViz data={vizData} />}
                        {vizData.model === ModelType.DualSystem && <DualSystemViz data={vizData} />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DecisionInspector;
