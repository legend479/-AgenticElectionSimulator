import React, { useState, useEffect } from 'react';
import { SimulationResult, ModelType, FullSimulationConfig, SimulationSettings, NudgeType, EditableNudgeParams } from '../types';
import Card from './ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell, LabelList, AreaChart, Area } from 'recharts';
import AgentExplorer from './results/AgentExplorer';
import DecisionInspector from './results/DecisionInspector';
import ThinkerIcon from './ui/ThinkerIcon';
import { cn, formatPercent } from '../services/utils';
import { BarChart3, PieChart, Search, Users, TrendingUp, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface ResultsDisplayProps {
  result: SimulationResult | null;
  isLoading: boolean;
  error: string | null;
  selectedModel: ModelType;
  fullConfig: FullSimulationConfig;
  settings: Omit<SimulationSettings, 'nudgeParams'>;
  nudgeParams: EditableNudgeParams;
}

type Tab = 'performance' | 'distribution' | 'inspector' | 'explorer';

const StatMetric: React.FC<{ title: string; value: string; subvalue?: string; colorClass?: string; icon?: React.ReactNode }> = ({ title, value, subvalue, colorClass = "text-sky-400", icon }) => (
    <div className="group flex flex-col p-5 bg-slate-900/40 border border-slate-800/50 rounded-2xl hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-300 shadow-sm hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
          <div className={cn("p-2 rounded-xl transition-colors duration-300", colorClass.replace('text-', 'bg-').replace('400', '400/10'), "group-hover:bg-opacity-20")}>
            {React.cloneElement(icon as React.ReactElement, { className: cn((icon as React.ReactElement).props.className, "w-4 h-4") })}
          </div>
        </div>
        <p className={cn("text-3xl font-black tracking-tighter", colorClass)}>{value}</p>
        {subvalue && <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">{subvalue}</p>}
    </div>
);

const AnimatedTurnoutGauge: React.FC<{ result: SimulationResult }> = ({ result }) => {
    const { turnout, groundTruth, baselineTurnout } = result;
    const [displayTurnout, setDisplayTurnout] = useState(0);

    useEffect(() => {
        const timeout = setTimeout(() => setDisplayTurnout(turnout), 100);
        return () => clearTimeout(timeout);
    }, [turnout]);

    const angle = displayTurnout * 180;
    const groundTruthAngle = groundTruth * 180;
    const baselineAngle = baselineTurnout !== undefined ? baselineTurnout * 180 : null;

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 180) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    return (
        <div className="relative h-72 w-full flex flex-col items-center justify-center">
            <svg viewBox="0 0 200 110" className="w-full max-w-md h-full drop-shadow-[0_20px_50px_rgba(14,165,233,0.15)]">
                <defs>
                    <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                </defs>
                {/* Background Arc */}
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="14" strokeLinecap="round" />
                {/* Foreground Arc */}
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGradient)" strokeWidth="14" strokeLinecap="round"
                    strokeDasharray={`${angle / 180 * Math.PI * 80}, ${Math.PI * 80}`}
                    style={{ transition: 'stroke-dasharray 2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                    filter="url(#glow)"
                />
                
                {/* Ground Truth Marker */}
                <line 
                  x1="100" y1="100" 
                  x2={polarToCartesian(100, 100, 88, groundTruthAngle).x} 
                  y2={polarToCartesian(100, 100, 88, groundTruthAngle).y} 
                  stroke="#f43f5e" strokeWidth="2" strokeDasharray="2 1" 
                />
                <circle cx={polarToCartesian(100, 100, 88, groundTruthAngle).x} cy={polarToCartesian(100, 100, 88, groundTruthAngle).y} r="3.5" fill="#f43f5e" />
                <text x={polarToCartesian(100, 100, 68, groundTruthAngle).x} y={polarToCartesian(100, 100, 68, groundTruthAngle).y} fill="#f43f5e" fontSize="6" fontWeight="900" textAnchor="middle" letterSpacing="0.1em">TRUTH</text>


                {/* Baseline Marker */}
                {baselineAngle !== null && (
                    <>
                    <line x1="100" y1="100" x2={polarToCartesian(100, 100, 88, baselineAngle).x} y2={polarToCartesian(100, 100, 88, baselineAngle).y} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" />
                    <text x={polarToCartesian(100, 100, 55, baselineAngle).x} y={polarToCartesian(100, 100, 55, baselineAngle).y} fill="#94a3b8" fontSize="5" textAnchor="middle" letterSpacing="0.1em">BASELINE</text>
                    </>
                )}

            </svg>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                <p className="text-7xl font-black text-white tracking-tighter drop-shadow-xl">{(turnout * 100).toFixed(1)}<span className="text-3xl text-sky-400 ml-1">%</span></p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">Simulated Turnout</p>
            </div>
        </div>
    );
};

const DistributionChart: React.FC<{ data: { prob: number; density: number }[] }> = ({ data }) => {
    return (
        <div className="h-full flex flex-col animate-slide-up">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-1">Vote Probability Distribution</h3>
              <p className="text-sm text-slate-500">Population density across the probability spectrum. Peaks at 0% or 100% indicate high model certainty.</p>
            </div>
            <div className="flex-grow w-full h-80">
                <ResponsiveContainer>
                    <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                        <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                        <XAxis 
                            dataKey="prob" 
                            unit="%" 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                            axisLine={false} 
                            tickLine={false}
                            interval={19}
                        />
                        <YAxis 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '0.75rem', backdropFilter: 'blur(8px)' }}
                            itemStyle={{ color: '#0ea5e9', fontSize: '12px' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                            formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, `Share`]}
                            labelFormatter={(label) => `Probability: ${Number(label).toFixed(0)}%`}
                        />
                        <Area type="monotone" dataKey="density" stroke="#0ea5e9" strokeWidth={3} fill="url(#colorUv)" animationDuration={1500} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, isLoading, error, selectedModel, fullConfig, settings, nudgeParams }) => {
  const [activeTab, setActiveTab] = useState<Tab>('performance');

  const modelComparisonData = result ? result.turnoutByModel.map(d => ({
    name: d.model,
    Turnout: d.turnout * 100
  })).sort((a,b) => b.Turnout - a.Turnout) : [];

  const TabButton: React.FC<{tabName: Tab, currentTab: Tab, children: React.ReactNode, icon: React.ReactNode}> = ({ tabName, currentTab, children, icon }) => (
    <button
        onClick={() => setActiveTab(tabName)}
        className={cn(
          "relative flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
          currentTab === tabName
            ? 'text-sky-400'
            : 'text-slate-500 hover:text-slate-300'
        )}
    >
        {icon}
        <span>{children}</span>
        {currentTab === tabName && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] animate-fade-in" />
        )}
    </button>
  );

  const renderResults = () => {
    if (!result) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center animate-fade-in">
          <div className="relative mb-10">
            <div className="h-32 w-32 rounded-[2.5rem] bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner rotate-12">
               <TrendingUp className="w-12 h-12 text-slate-700 -rotate-12" />
            </div>
            <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 animate-bounce">
               <Zap className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white mb-3 tracking-tighter uppercase">Simulation Engine Idle</h3>
          <p className="max-w-xs text-sm text-slate-500 leading-relaxed font-medium">
            The agentic population is waiting for your parameters. 
            Adjust the <span className="text-sky-400">Scenario Context</span> or <span className="text-sky-400">Model Logic</span> to begin.
          </p>
          <div className="mt-8 flex gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-800" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-800" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-800" />
          </div>
      </div>
    );
    
    const nudgeLift = result.baselineTurnout !== undefined ? result.turnout - result.baselineTurnout : null;

    return (
        <div className="flex flex-col h-full animate-slide-up">
            <div className="p-8 bg-gradient-to-b from-slate-900/20 to-transparent">
                <AnimatedTurnoutGauge result={result} />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                   <StatMetric 
                    title="Ground Truth" 
                    value={formatPercent(result.groundTruth)} 
                    icon={<CheckCircle2 className="w-3 h-3" />} 
                    colorClass="text-slate-300" 
                    subvalue="Historical Reference"
                   />
                   <StatMetric 
                    title="Model Error" 
                    value={`${((result.turnout - result.groundTruth) * 100).toFixed(2)}pp`} 
                    icon={<AlertCircle className="w-3 h-3" />} 
                    colorClass={Math.abs(result.turnout - result.groundTruth) < 0.05 ? "text-emerald-400" : "text-amber-400"} 
                    subvalue="Deviation from Truth"
                   />
                   {nudgeLift !== null && (
                       <StatMetric
                           title="Nudge Impact" 
                           value={`${nudgeLift >= 0 ? '+' : ''}${(nudgeLift * 100).toFixed(2)}pp`}
                           icon={nudgeLift >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                           colorClass={nudgeLift >= 0 ? 'text-emerald-400' : 'text-rose-400'}
                           subvalue="Delta vs Baseline"
                       />
                   )}
                   {settings.nudge !== NudgeType.None && result.baselineTurnout && (
                       <StatMetric 
                        title="Baseline" 
                        value={formatPercent(result.baselineTurnout)} 
                        icon={<TrendingUp className="w-3 h-3" />} 
                        colorClass="text-slate-400" 
                        subvalue="Pre-Intervention"
                       />
                   )}
                </div>
            </div>
            
            <div className="flex justify-between items-center border-y border-slate-800/50 bg-slate-900/30 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex overflow-x-auto no-scrollbar">
                    <TabButton tabName="performance" currentTab={activeTab} icon={<BarChart3 className="w-4 h-4" />}>Performance</TabButton>
                    <TabButton tabName="distribution" currentTab={activeTab} icon={<PieChart className="w-4 h-4" />}>Distribution</TabButton>
                    <TabButton tabName="inspector" currentTab={activeTab} icon={<Search className="w-4 h-4" />}>Inspector</TabButton>
                    <TabButton tabName="explorer" currentTab={activeTab} icon={<Users className="w-4 h-4" />}>Explorer</TabButton>
                </div>
                <div className="hidden sm:flex flex-col items-end px-6 py-2 border-l border-slate-800/50">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Active Scenario</span>
                    <span className="text-xs font-bold text-sky-400 truncate max-w-[150px]">{fullConfig.profileName}</span>
                </div>
            </div>
            
            <div className="flex-grow p-8">
                {activeTab === 'performance' && (
                     <div className="space-y-12 animate-slide-up">
                        <div>
                            <div className="mb-6">
                              <h3 className="text-lg font-bold text-white mb-1">Model Benchmarking</h3>
                              <p className="text-sm text-slate-500">Comparing the active model against alternatives within the same scenario context.</p>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer>
                                    <BarChart data={modelComparisonData} layout="vertical" margin={{ top: 5, right: 40, left: 0, bottom: 5 }}>
                                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" strokeOpacity={0.1} horizontal={false} />
                                        <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: '#f8fafc', fontSize: 11, fontWeight: 600 }} width={120} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.75rem' }}
                                            itemStyle={{ color: '#0ea5e9', fontSize: '12px' }}
                                            formatter={(value: number) => [`${value.toFixed(2)}%`, 'Turnout']}
                                        />
                                        <ReferenceLine x={result.groundTruth * 100} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'GT', position: 'top', fill: '#f43f5e', fontSize: 10, fontWeight: 'bold' }} />
                                        <Bar dataKey="Turnout" radius={[0, 4, 4, 0]} barSize={24}>
                                            <LabelList dataKey="Turnout" position="right" formatter={(v:number) => `${v.toFixed(1)}%`} fill="#94a3b8" fontSize={10} offset={10} fontWeight="bold" />
                                            {modelComparisonData.map((entry) => (
                                                <Cell 
                                                  key={`cell-${entry.name}`} 
                                                  fill={entry.name === selectedModel ? '#0ea5e9' : '#1e293b'} 
                                                  stroke={entry.name === selectedModel ? '#38bdf8' : '#334155'}
                                                  strokeWidth={1}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {selectedModel === ModelType.DualSystem && result.diagnostics && (
                            <div className="pt-8 border-t border-slate-800/50">
                                <div className="mb-6">
                                  <h3 className="text-lg font-bold text-white mb-1">Dual-System Diagnostics</h3>
                                  <p className="text-sm text-slate-500">Internal metrics for the System 1 (Automatic) vs System 2 (Deliberative) model.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-xl">
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">System 1 Prob.</p>
                                      <p className="text-xl font-bold text-white">{(result.diagnostics.avgP1 * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-xl">
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">System 2 Prob.</p>
                                      <p className="text-xl font-bold text-white">{(result.diagnostics.avgP2 * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-xl">
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Avg. Weight (λ)</p>
                                      <p className="text-xl font-bold text-sky-400">{(result.diagnostics.avgLambda).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'distribution' && (
                    <DistributionChart data={result.voteProbDistribution} />
                )}
                {activeTab === 'inspector' && (
                    <DecisionInspector result={result} config={fullConfig} settings={settings} nudgeParams={nudgeParams} />
                )}
                {activeTab === 'explorer' && (
                    <AgentExplorer agents={result.agents} />
                )}
            </div>
        </div>
    );
  }

  return (
    <Card className="h-full min-h-[700px] flex flex-col overflow-hidden border-slate-800/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-slate-800 border-t-sky-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ThinkerIcon className="w-8 h-8 text-sky-500/50 animate-pulse" />
                </div>
              </div>
              <p className="text-lg font-bold text-white mt-8 tracking-widest uppercase">Simulating Population</p>
              <p className="text-sm text-slate-500 mt-2">Running agentic decision loops...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-rose-400 p-12 text-center">
            <AlertCircle className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-bold mb-2">Simulation Failed</h3>
            <p className="text-sm text-slate-500 max-w-xs">{error}</p>
          </div>
        ) : renderResults()}
    </Card>
  );
};

export default ResultsDisplay;
