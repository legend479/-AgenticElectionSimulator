
import { Agent, SimulationSettings, SimulationResult, ModelType, NudgeType, FullSimulationConfig, AgentDecision } from '../types';

// --- AGENT FACTORY ---

// Simple power transform to approximate a Beta distribution skew.
// shape > 1 skews towards 1, shape < 1 skews towards 0.
const skewedRandom = (shape: number) => Math.pow(Math.random(), 1 / shape);

const generateAgents = (config: FullSimulationConfig, numAgents: number): Agent[] => {
    const agents: Agent[] = [];
    const genParams = config.agentGeneration;

    for (let i = 0; i < numAgents; i++) {
        const n_past_votes = Array(5).fill(0).reduce((acc) => acc + (Math.random() < genParams.past_vote_prob ? 1 : 0), 0);

        const agent: Agent = {
            id: i,
            education_normalized: 1 - skewedRandom(genParams.education_skew),
            age: genParams.age_min + Math.random() * genParams.age_range,
            urbanicity: Math.random() < genParams.urban_prob ? 1 : 0,
            civic_duty: 1 - skewedRandom(genParams.civic_duty_skew),
            habit_strength: n_past_votes / 5,
            social_pressure_sensitivity: 1 - skewedRandom(genParams.social_pressure_skew),
            risk_aversion: 1 - skewedRandom(genParams.risk_aversion_skew),
            partisan_identity_strength: 1-skewedRandom(genParams.partisan_strength_skew),
            overconfidence: skewedRandom(1.5),
            personality_match_candidate: Math.random(),
            issue_salience: Math.random(),
        };
        agents.push(agent);
    }
    return agents;
};


// --- SIMULATION MODELS ---

const logistic = (x: number) => 1 / (1 + Math.exp(-x));

// MODEL 1: Extended Utility
const runUtilityModel = (agents: Agent[], config: FullSimulationConfig, settings: SimulationSettings): { decisions: AgentDecision[] } => {
    const context = config.globalContext;
    const params = config.modelPhysics.utility;
    const { beta_pB, beta_C, beta_D, beta_S, beta_H } = params;

    const decisions: AgentDecision[] = [];

    agents.forEach((agent) => {
        const B = agent.issue_salience * agent.partisan_identity_strength * agent.personality_match_candidate;
        const p_i = context.electoral_competitiveness * (1 + 0.2 * agent.overconfidence);
        const pB_val = p_i * B;
        
        let C_val = context.voting_cost_total * (1 - 0.4 * agent.education_normalized) * (1 + 0.3 * agent.risk_aversion);
        let D_val = agent.civic_duty;

        if(settings.nudge === NudgeType.Implementation) C_val *= (1 - settings.nudgeParams[NudgeType.Implementation].cost_reduction);
        if(settings.nudge === NudgeType.IdentityFrame) D_val *= (1 + settings.nudgeParams[NudgeType.IdentityFrame].strength * 0.2);

        const utilityComponents = {
            pB: pB_val * beta_pB,
            C: C_val * beta_C, // beta_C is negative, so this reduces utility
            D: D_val * beta_D,
            S: agent.social_pressure_sensitivity * beta_S,
            H: agent.habit_strength * beta_H,
        };
        
        let finalUtility = Object.values(utilityComponents).reduce((a, b) => a + b, 0);

        if(settings.nudge === NudgeType.Monetary) {
            const nudge = settings.nudgeParams[NudgeType.Monetary];
            const nudgeValue = nudge.lottery_probability * nudge.lottery_value / (1 + agent.civic_duty);
            finalUtility += nudgeValue;
        }
        
        // Safety: ensure noise is not zero to avoid division by zero
        const noise = Math.max(0.01, params.decision_noise);
        const voteProb = logistic(finalUtility / noise);
        decisions.push({ ...agent, voted: Math.random() < voteProb, voteProb });
    });
    return { decisions };
}

// MODEL 2: Drift-Diffusion (Analytical)
const runDDM = (agents: Agent[], config: FullSimulationConfig, settings: SimulationSettings): { decisions: AgentDecision[] } => {
    const context = config.globalContext;
    const params = config.modelPhysics.ddm;
    const { beta_D, beta_H, beta_S, beta_C, beta_pB, beta_OC } = params;
    
    const decisions: AgentDecision[] = [];

    agents.forEach((agent) => {
        let a = params.threshold_a * (1 + 0.4 * agent.risk_aversion) * (1 - 0.3 * agent.education_normalized);
        const bias = 0.2 * agent.habit_strength + 0.1 * (agent.partisan_identity_strength - 0.5);
        // Clamp start point z to be strictly between 0 and a
        let z = Math.max(0.01, Math.min(a * 0.99, a * (0.5 + bias)));
        let sigma = params.noise * (1 + 0.3 * (1 - agent.education_normalized));
        
        const B = agent.issue_salience * agent.partisan_identity_strength;
        const pB_val = context.electoral_competitiveness * B;

        let mu = params.base_mu +
            (agent.civic_duty * beta_D) +
            (agent.habit_strength * beta_H) +
            (agent.social_pressure_sensitivity * beta_S) +
            (pB_val * beta_pB) +
            (agent.overconfidence * beta_OC) +
            (context.voting_cost_total * beta_C); // beta_C is negative

        if (settings.nudge === NudgeType.Implementation) {
             a *= (1 - settings.nudgeParams[NudgeType.Implementation].cost_reduction);
             z += settings.nudgeParams[NudgeType.Implementation].habit_boost * a;
        }
        if (settings.nudge === NudgeType.SocialNorm) {
            mu += beta_S * 0.5 * (settings.nudgeParams[NudgeType.SocialNorm].revealed_turnout - 0.5);
        }
        
        // Safety clamp for mu to prevents math overflows with exp
        mu = Math.max(-2, Math.min(2, mu));

        let voteProb;
        const two_mu_sigma2 = 2 * mu / (sigma * sigma);

        if (Math.abs(mu) < 1e-5) {
            // Limit case as mu -> 0
            voteProb = z / a;
        } else if (mu < 0) {
            // Numerically stable formula for negative drift
            // Standard formula involves e^(positive_large) which is unstable.
            // Refactored to: P = (e^(lambda*(z-a)) - e^(-lambda*a)) / (1 - e^(-lambda*a))
            // where lambda = -2*mu/sigma^2 (which is positive)
            
            const lambda = -two_mu_sigma2; 
            const term1 = Math.exp(lambda * (z - a));
            const term2 = Math.exp(-lambda * a);
            voteProb = (term1 - term2) / (1 - term2);
        } else {
            // Standard formula for positive drift
            // P = (1 - e^(-2*mu*z/sigma^2)) / (1 - e^(-2*mu*a/sigma^2))
            const expZ = Math.exp(-two_mu_sigma2 * z);
            const expA = Math.exp(-two_mu_sigma2 * a);
            voteProb = (1 - expZ) / (1 - expA);
        }
        
        // Final safety clamp
        voteProb = Math.max(0, Math.min(1, isNaN(voteProb) ? 0 : voteProb));

        decisions.push({ ...agent, voted: Math.random() < voteProb, voteProb });
    });
    return { decisions };
}

// MODEL 3: Dual-System (Improved)
const runDualSystem = (agents: Agent[], config: FullSimulationConfig, settings: SimulationSettings): { decisions: AgentDecision[], diagnostics: any } => {
    const context = config.globalContext;
    const params = config.modelPhysics.dual_system;

    const diagnostics = { avgP1: 0, avgP2: 0, avgLambda: 0 };
    const decisions: AgentDecision[] = [];

    agents.forEach((agent) => {
        const affect = 0.6 * agent.personality_match_candidate + 0.4 * agent.overconfidence;
        
        // --- SYSTEM 1: Associative Activation (Heuristic) ---
        // Fast pattern matching based on strong cues. 
        // No "Cost" or "Probability" calculation here. Just impulse.
        
        let s1_activation = params.h_momentum; // Baseline impulse
        s1_activation += params.h_habit * agent.habit_strength;
        s1_activation += params.h_social * agent.social_pressure_sensitivity;
        s1_activation += params.h_affect * affect;
        
        // Interaction term (priming): Habit amplifies Social cues
        s1_activation += 0.5 * (agent.habit_strength * agent.social_pressure_sensitivity);

        // Nudges affecting System 1 (Framing, Social Norms)
        if (settings.nudge === NudgeType.SocialNorm) {
            const socialNudge = 0.5 * (settings.nudgeParams[NudgeType.SocialNorm].revealed_turnout - 0.5);
            s1_activation += params.h_social * socialNudge;
        }
        if (settings.nudge === NudgeType.IdentityFrame) {
             // "Be a voter" targets self-concept (affect/habit link)
             s1_activation += params.h_affect * settings.nudgeParams[NudgeType.IdentityFrame].strength;
        }

        // Activation -> Probability (Sigmoid)
        const p_vote_s1 = logistic(s1_activation - 0.5); // Centered at 0.5 activation

        // --- SYSTEM 2: Rational Utility Maximization (Algorithmic) ---
        // Explicit Riker-Ordeshook Calculus: U = P*B - C + D
        
        const B = agent.issue_salience * agent.partisan_identity_strength;
        const P = context.electoral_competitiveness; // Simple pivotality proxy
        const C = context.voting_cost_total;
        const D = agent.civic_duty;

        let utility_s2 = (params.u_pB * P * B) + (params.u_cost * C) + (params.u_duty * D);
        
        // Nudges affecting System 2 (Cost reduction, Info)
        if (settings.nudge === NudgeType.Implementation) {
            // Reduces perceived cost in utility calc
            utility_s2 -= params.u_cost * C * settings.nudgeParams[NudgeType.Implementation].cost_reduction;
        }
        if (settings.nudge === NudgeType.Competitiveness) {
            // Increases P perception
            const infoBoost = settings.nudgeParams[NudgeType.Competitiveness].info_boost;
            utility_s2 += params.u_pB * (P * infoBoost) * B;
        }
        
        // Utility -> Probability (Sigmoid with noise)
        const p_vote_s2 = logistic(utility_s2);

        // --- ARBITER: Cognitive Control ---
        // Lambda determines the weight of System 1 (Impulse) vs System 2 (Reflection)
        // High Lambda = Impulsive/Heuristic. Low Lambda = Deliberative.
        
        let lambda = params.lambda_base;
        
        // Education increases System 2 usage (lowers lambda)
        lambda += params.lambda_edu_factor * agent.education_normalized;
        
        // Risk aversion might increase deliberation (lowers lambda)
        lambda += params.lambda_risk_factor * agent.risk_aversion;

        // Clamp Lambda
        const finalLambda = Math.max(0, Math.min(1, lambda));

        // Final Probability
        const p_vote = finalLambda * p_vote_s1 + (1 - finalLambda) * p_vote_s2;

        diagnostics.avgP1 += p_vote_s1;
        diagnostics.avgP2 += p_vote_s2;
        diagnostics.avgLambda += finalLambda;

        decisions.push({ ...agent, voted: Math.random() < p_vote, voteProb: p_vote, affect: affect });
    });

    diagnostics.avgP1 /= agents.length;
    diagnostics.avgP2 /= agents.length;
    diagnostics.avgLambda /= agents.length;

    return { decisions, diagnostics };
}

const calculateProbabilityDensity = (decisions: AgentDecision[]): { prob: number, density: number }[] => {
    const binCount = 20;
    const bins = new Array(binCount).fill(0);
    const total = decisions.length;
    
    decisions.forEach(d => {
        const binIndex = Math.min(Math.floor(d.voteProb * binCount), binCount - 1);
        bins[binIndex]++;
    });
    
    return bins.map((count, i) => ({
        prob: ((i + 0.5) / binCount) * 100, // Midpoint of bin as a percentage
        density: total > 0 ? count / total : 0 // Normalized frequency (0-1)
    }));
};


// --- MAIN ORCHESTRATOR ---
export const runSimulation = (config: FullSimulationConfig, settings: SimulationSettings): Promise<SimulationResult> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Shallow copy config to ensure no accidental mutation of the template
            const runConfig = JSON.parse(JSON.stringify(config));
            
            const agents = generateAgents(runConfig, settings.numAgents);
            // Make a shallow copy of agents for each model to prevent mutation bleeding
            const agentsCopy1 = agents.map(a => ({...a}));
            
            let primaryResult: { decisions: AgentDecision[]; diagnostics?: any; };
            let baselineTurnout: number | undefined;
            const turnoutByModel: { model: ModelType, turnout: number }[] = [];

            const modelRunners = {
                [ModelType.Utility]: runUtilityModel,
                [ModelType.DDM]: runDDM,
                [ModelType.DualSystem]: runDualSystem,
            };

            // Run all models for comparison data with current nudge
            for (const modelType of Object.values(ModelType)) {
                const runner = modelRunners[modelType as ModelType] as (agents: Agent[], config: FullSimulationConfig, settings: SimulationSettings) => { decisions: AgentDecision[] };
                // Pass fresh copy of agents
                const result = runner(agents.map(a => ({...a})), runConfig, settings);
                const turnout = result.decisions.filter(d => d.voted).length / result.decisions.length;
                turnoutByModel.push({ model: modelType, turnout });

                if (modelType === settings.model) {
                    primaryResult = result;
                }
            }

            // If a nudge is active, run the selected model again without the nudge to get a baseline
            if (settings.nudge !== NudgeType.None) {
                const baselineSettings = { ...settings, nudge: NudgeType.None, nudgeParams: { ...settings.nudgeParams, [NudgeType.None]: {} } };
                const runner = modelRunners[settings.model] as (agents: Agent[], config: FullSimulationConfig, settings: SimulationSettings) => { decisions: AgentDecision[] };
                const baselineResult = runner(agents.map(a => ({...a})), runConfig, baselineSettings);
                baselineTurnout = baselineResult.decisions.filter(d => d.voted).length / baselineResult.decisions.length;
            }
            
            const selectedModelTurnout = turnoutByModel.find(m => m.model === settings.model)!.turnout;
            const voteProbDistribution = calculateProbabilityDensity(primaryResult!.decisions);

            resolve({
                turnout: selectedModelTurnout,
                groundTruth: runConfig.globalContext.ground_truth_turnout,
                diagnostics: primaryResult!.diagnostics,
                agents: primaryResult!.decisions,
                turnoutByModel: turnoutByModel,
                baselineTurnout: baselineTurnout,
                voteProbDistribution: voteProbDistribution,
            });
        }, 50);
    });
};
