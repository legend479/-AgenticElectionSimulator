

import React, { useState, useMemo } from 'react';
import { FullSimulationConfig, ModelType, TuningResult, TuningScenario, NudgeType, EditableNudgeParams, DeepAnalysisResult, TuningHistoryPoint } from '../types';
import { SCENARIO_TEMPLATES, NUDGE_PARAMS } from '../constants';
import { runTuner, runDeepAnalysis } from '../services/tuningService';
import Card from './ui/Card';
import Modal from './ui/Modal';
import NudgeParamsEditor from './NudgeParamsEditor';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar, Cell, ScatterChart, Scatter, ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ZAxis, Label } from 'recharts';

// Helper to transform multi-run history into Recharts friendly format
const transformMultiRunData = (history: { run: number; data: TuningHistoryPoint[] }[]) => {
    if (!history || history.length === 0) return [];
    
    // Assume runs are roughly same length, assume max 50 steps for x-axis scaling
    const steps = 50; 
    const data = [];
    
    for (let i = 0; i < steps; i++) {
        const point: any = { iteration: i + 1 };
        let hasData = false;
        history.forEach(run => {
            if (run.data[i]) {
                point[`run${run.run}`] = run.data[i].error;
                hasData = true;
            }
        });
        if (hasData) data.push(point);
    }
    return data;
};

const ModelTuner: React.FC = () => {
    const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Utility);
    const [isTuning, setIsTuning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentError, setCurrentError] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [result, setResult] = useState<TuningResult | null>(null);
    const [liveChartData, setLiveChartData] = useState<any[]>([]);
    
    // Deep Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [deepAnalysisResult, setDeepAnalysisResult] = useState<DeepAnalysisResult | null>(null);

    // Initial State: Map constants to TuningScenario objects
    const [tuningScenarios, setTuningScenarios] = useState<TuningScenario[]>(() => 
        Object.entries(SCENARIO_TEMPLATES).map(([key, template]) => ({
            id: key,
            config: template,
            nudgeSettings: { 
                nudge: NudgeType.None, 
                nudgeParams: JSON.parse(JSON.stringify(NUDGE_PARAMS)) 
            }
        }))
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Extended State for Scenario Builder
    const [newScenarioName, setNewScenarioName] = useState('');
    const [newScenarioGT, setNewScenarioGT] = useState(0.5);
    const [newScenarioCost, setNewScenarioCost] = useState(0.5);
    const [newScenarioComp, setNewScenarioComp] = useState(0.5);
    
    // Demographics
    const [newScenarioEduSkew, setNewScenarioEduSkew] = useState(1.0);
    const [newScenarioDutySkew, setNewScenarioDutySkew] = useState(1.0);
    const [newScenarioUrbanProb, setNewScenarioUrbanProb] = useState(0.5);
    const [newScenarioPastVoteProb, setNewScenarioPastVoteProb] = useState(0.75);
    const [newScenarioSocialSkew, setNewScenarioSocialSkew] = useState(1.0);
    const [newScenarioRiskSkew, setNewScenarioRiskSkew] = useState(1.0);
    const [newScenarioPartisanSkew, setNewScenarioPartisanSkew] = useState(1.0);

    const [newScenarioNudge, setNewScenarioNudge] = useState<NudgeType>(NudgeType.None);
    const [newScenarioNudgeParams, setNewScenarioNudgeParams] = useState<EditableNudgeParams>(JSON.parse(JSON.stringify(NUDGE_PARAMS)));

    const handleStartTuning = async () => {
        setIsTuning(true);
        setResult(null);
        setDeepAnalysisResult(null); 
        setProgress(0);
        setLiveChartData([]);
        setStatusText("Initializing...");

        try {
            const tuningResult = await runTuner(tuningScenarios, selectedModel, 50, (prog, err, status, liveHistory) => {
                setProgress(prog);
                setCurrentError(err);
                setStatusText(status);
                if (liveHistory) {
                    setLiveChartData(transformMultiRunData(liveHistory));
                }
            });
            setResult(tuningResult);
        } catch (e) {
            console.error(e);
        } finally {
            setIsTuning(false);
        }
    };

    const handleStartDeepAnalysis = async () => {
        if (!result) return;
        setIsAnalyzing(true);
        setDeepAnalysisResult(null);
        setAnalysisProgress(0);

        try {
            const analysis = await runDeepAnalysis(
                tuningScenarios, 
                result.optimizedParams, 
                selectedModel, 
                (prog) => setAnalysisProgress(prog)
            );
            setDeepAnalysisResult(analysis);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleExportReport = () => {
        if (!result) return;

        const report = {
            reportMetadata: {
                title: "Agentic Election Simulator - Calibration & Analysis Report",
                generatedAt: new Date().toISOString(),
                appVersion: "2.1",
                userNotes: "Automated export from Model Tuner interface."
            },
            experimentConfiguration: {
                targetModel: selectedModel,
                tunerParameters: result.tunerConfig,
                dataset: {
                    description: "Set of scenarios used for calibration targets.",
                    scenarios: tuningScenarios.map(s => ({
                        id: s.id,
                        profileName: s.config.profileName,
                        groundTruth: s.config.globalContext.ground_truth_turnout,
                        fullConfiguration: s.config,
                        activeIntervention: s.nudgeSettings
                    }))
                }
            },
            calibrationResults: {
                executiveMetrics: {
                    finalRMSE: result.finalError,
                    improvement: result.improvement,
                    rSquared: result.rSquared,
                    meanAbsoluteError: result.mae
                },
                optimizedPhysicsParameters: result.optimizedParams,
                parameterSensitivity: result.paramSensitivity,
                validationAgainstGroundTruth: result.calibrationData,
                automatedTextAnalysis: result.analysis
            },
            processDiagnostics: {
                description: "Detailed trace of the optimization engine.",
                parameterEvolutionStepByStep: result.paramHistory,
                optimizationLossHistory: {
                    combinedLinearHistory: result.history,
                    parallelRunTraces: result.multiRunHistory
                }
            },
            strategicDeepAnalysis: deepAnalysisResult ? {
                status: "Completed",
                executiveReport: deepAnalysisResult.report,
                nudgeEffectivenessRanking: deepAnalysisResult.nudgePerformance,
                comprehensiveSimulationLog: deepAnalysisResult.detailedResults
            } : {
                status: "Not Run",
                note: "Deep analysis was not executed prior to export."
            }
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `AES_Tuning_Report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleAddScenario = () => {
        if (!newScenarioName.trim()) return;

        // Clone a template to get base structure
        const baseConfig = JSON.parse(JSON.stringify(SCENARIO_TEMPLATES.TVM)) as FullSimulationConfig;
        
        // Apply custom overrides
        baseConfig.profileName = newScenarioName;
        baseConfig.globalContext.ground_truth_turnout = newScenarioGT;
        baseConfig.globalContext.voting_cost_total = newScenarioCost;
        baseConfig.globalContext.electoral_competitiveness = newScenarioComp;
        
        // Demographics overrides
        baseConfig.agentGeneration.education_skew = newScenarioEduSkew;
        baseConfig.agentGeneration.civic_duty_skew = newScenarioDutySkew;
        baseConfig.agentGeneration.urban_prob = newScenarioUrbanProb;
        baseConfig.agentGeneration.past_vote_prob = newScenarioPastVoteProb;
        baseConfig.agentGeneration.social_pressure_skew = newScenarioSocialSkew;
        baseConfig.agentGeneration.risk_aversion_skew = newScenarioRiskSkew;
        baseConfig.agentGeneration.partisan_strength_skew = newScenarioPartisanSkew;

        const newScenario: TuningScenario = {
            id: `custom-${Date.now()}`,
            config: baseConfig,
            nudgeSettings: {
                nudge: newScenarioNudge,
                nudgeParams: newScenarioNudgeParams
            }
        };

        setTuningScenarios([...tuningScenarios, newScenario]);
        setIsModalOpen(false);
        // Reset form
        setNewScenarioName('');
    };

    const handleRemoveScenario = (id: string) => {
        if (tuningScenarios.length <= 1) {
            alert("At least one scenario is required for calibration.");
            return;
        }
        setTuningScenarios(prev => prev.filter(s => s.id !== id));
    };

    // --- CHART DATA PREPARATION ---

    const multiRunChartData = useMemo(() => {
        if (isTuning) return liveChartData;
        if (!result || !result.multiRunHistory || result.multiRunHistory.length === 0) return [];
        return transformMultiRunData(result.multiRunHistory);
    }, [result, isTuning, liveChartData]);

    const sensitivityChartData = result ? result.paramSensitivity.slice(0, 8).reverse() : [];
    const colors = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];
    const runColors = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b']; 

    // Heatmap Data Preparation for Deep Analysis
    const heatmapData = useMemo(() => {
        if (!deepAnalysisResult) return { data: [], nudges: [], scenarioNames: [] };
        // Transform to Z-Axis Scatter format for pseudo-heatmap
        const data: any[] = [];
        const nudges = Array.from(new Set(deepAnalysisResult.detailedResults.map(r => r.nudge)));
        const scenarioNames = Array.from(new Set(deepAnalysisResult.detailedResults.map(r => r.scenarioName)));
        
        deepAnalysisResult.detailedResults.forEach(r => {
            data.push({
                x: nudges.indexOf(r.nudge), // categorical index
                y: scenarioNames.indexOf(r.scenarioName), // categorical index
                z: r.lift * 100, // Lift percentage
                nudge: r.nudge,
                scenario: r.scenarioName
            });
        });
        return { data, nudges, scenarioNames };
    }, [deepAnalysisResult]);

    const consistencyData = useMemo(() => {
        if (!deepAnalysisResult) return [];
        return deepAnalysisResult.nudgePerformance.map(p => ({
            x: p.avgLift * 100,
            y: p.consistency * 100, // lower is better, but standard chart Y is up
            z: 1,
            nudge: p.nudge
        }));
    }, [deepAnalysisResult]);


    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-2 rounded text-xs shadow-lg">
                    <p className="text-slate-300 font-bold mb-1">{payload[0].payload.scenarioName}</p>
                    <p className="text-sky-400">Predicted: {(payload[0].value * 100).toFixed(1)}%</p>
                    <p className="text-emerald-400">Actual: {(payload[0].payload.actual * 100).toFixed(1)}%</p>
                </div>
            );
        }
        return null;
    };

    const getHeatmapColor = (lift: number) => {
        if (lift <= 0) return '#475569'; // Slate 600 (Neutral/Negative)
        if (lift < 1.5) return '#0ea5e9'; // Sky 500 (Low)
        if (lift < 3.5) return '#6366f1'; // Indigo 500 (Medium)
        if (lift < 6.0) return '#a855f7'; // Purple 500 (High)
        return '#ec4899'; // Pink 500 (Very High)
    };


    const InputRow: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
        <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{label}</label>
            {children}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <header className="text-center mb-8 py-8 bg-gradient-to-b from-slate-900 to-transparent rounded-2xl border-b border-slate-800/50">
                <div className="inline-flex items-center justify-center p-3 bg-orange-900/30 rounded-full mb-4 border border-orange-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                </div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">Model Tuner & Analysis</h1>
                <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                    Perform exhaustive mathematical calibration against ground-truth data, then run deep simulations to derive strategic behavioral insights.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CONTROL PANEL */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">1. Calibration Engine</h3>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-400 mb-2">Target Model</label>
                            <select 
                                value={selectedModel} 
                                onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                disabled={isTuning}
                            >
                                {Object.values(ModelType).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div className="mb-6">
                             <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-400">Calibration Scenarios</label>
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    disabled={isTuning}
                                    className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition"
                                >
                                    + Add
                                </button>
                             </div>
                            <div className="space-y-2 bg-slate-900/50 p-3 rounded border border-slate-800 max-h-60 overflow-y-auto">
                                {tuningScenarios.map(s => (
                                    <div key={s.id} className="flex items-center justify-between text-sm bg-slate-800/50 p-2 rounded">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-slate-300 font-medium truncate">{s.config.profileName.split('(')[0]}</span>
                                            <span className="text-xs text-slate-500 flex gap-2">
                                                <span>GT: {(s.config.globalContext.ground_truth_turnout * 100).toFixed(0)}%</span>
                                                {s.nudgeSettings.nudge !== NudgeType.None && <span className="text-orange-400">{s.nudgeSettings.nudge}</span>}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveScenario(s.id)}
                                            disabled={isTuning || tuningScenarios.length <= 1}
                                            className="ml-2 text-slate-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleStartTuning}
                            disabled={isTuning || isAnalyzing}
                            className="w-full bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-500 hover:to-red-400 disabled:bg-slate-700 disabled:from-slate-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg shadow-orange-900/20 flex flex-col justify-center items-center"
                        >
                            {isTuning ? (
                                <>
                                     <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        {statusText || `Calibrating... ${(progress).toFixed(0)}%`}
                                     </div>
                                </>
                            ) : 'Start Calibration'}
                        </button>
                    </Card>
                    
                    {/* DEEP ANALYSIS TRIGGER */}
                    {result && (
                        <div className="animate-fade-in space-y-4">
                             <button
                                onClick={handleStartDeepAnalysis}
                                disabled={isAnalyzing}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 disabled:bg-slate-700 disabled:from-slate-700 text-white font-bold py-4 px-4 rounded-lg transition shadow-lg shadow-indigo-900/20 flex flex-col items-center justify-center border border-indigo-400/30"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <svg className="animate-spin mb-2 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span className="text-sm font-normal opacity-80">Running Nudge Matrix... {(analysisProgress).toFixed(0)}%</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-lg">Run Strategic Deep Analysis</span>
                                        <span className="text-xs font-normal opacity-70 mt-1">Test all nudges against calibrated population</span>
                                    </>
                                )}
                            </button>
                            
                            <button
                                onClick={handleExportReport}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-lg transition border border-slate-700 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Export Full Dataset (JSON)
                            </button>
                        </div>
                    )}


                    {/* METRICS */}
                    {(isTuning || result) && (
                         <Card className="p-6">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Global Error (RMSE)</h3>
                            <p className="text-3xl font-mono font-bold text-white mb-4">
                                {isTuning ? currentError.toFixed(4) : result?.finalError.toFixed(4)}
                            </p>
                            <div className="h-40 w-full">
                                <ResponsiveContainer>
                                    <LineChart data={multiRunChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.2} />
                                        <XAxis dataKey="iteration" hide />
                                        <YAxis domain={['auto', 'auto']} hide />
                                        <Tooltip 
                                            contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', fontSize: '12px'}} 
                                            formatter={(value: number) => value.toFixed(4)}
                                            labelFormatter={(label) => `Step ${label}`}
                                        />
                                        <Legend iconType="plainline" wrapperStyle={{fontSize: '10px', paddingTop: '5px'}} />
                                        {[1, 2, 3, 4].map((runNum, index) => (
                                            <Line 
                                                key={runNum} 
                                                type="monotone" 
                                                dataKey={`run${runNum}`} 
                                                name={`Run ${runNum}`}
                                                stroke={runColors[index % runColors.length]} 
                                                strokeWidth={2} 
                                                dot={false} 
                                                isAnimationActive={false}
                                                opacity={0.8}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                         </Card>
                    )}
                    
                    {result && (
                        <>
                        <Card className="p-6">
                             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Goodness of Fit (R²)</h3>
                             <div className="flex items-baseline gap-2">
                                <p className={`text-3xl font-mono font-bold ${result.rSquared > 0.8 ? 'text-green-400' : result.rSquared > 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {result.rSquared.toFixed(3)}
                                </p>
                                <span className="text-slate-500 text-sm">/ 1.000</span>
                             </div>
                             {result.rSquared < 0 && (
                                 <p className="text-xs text-red-400 mt-2">Poor Fit: Model performing worse than mean baseline.</p>
                             )}
                             <p className="text-xs text-slate-500 mt-2">
                                R² indicates the proportion of variance in the ground truth explained by the model. 1.0 is a perfect fit.
                             </p>
                        </Card>
                        </>
                    )}
                </div>

                {/* RESULTS & ANALYSIS */}
                <div className="lg:col-span-2 space-y-8">
                    {!result && !isTuning && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl p-12">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p>Configure scenarios and start calibration to generate the Behavioral Analysis Report.</p>
                        </div>
                    )}

                    {/* --- CALIBRATION RESULTS --- */}
                    {result && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white border-l-4 border-orange-500 pl-3">2. Calibration Analysis</h2>
                            </div>
                            
                            {/* ANALYSIS REPORT TEXT */}
                            <div className="bg-slate-950 rounded-lg border border-slate-800 font-mono text-sm shadow-2xl overflow-hidden">
                                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="ml-2 text-slate-400">calibration_report.txt</span>
                                </div>
                                <div className="p-6 space-y-6 text-slate-300">
                                    <div>
                                        <p className="text-orange-400 font-bold mb-1">{'>'} MATHEMATICAL SUMMARY</p>
                                        <p className="leading-relaxed pl-4 border-l-2 border-slate-800">{result.analysis.mathematicalSummary}</p>
                                    </div>
                                    <div>
                                        <p className="text-sky-400 font-bold mb-1">{'>'} BEHAVIORAL INSIGHT</p>
                                        <p className="leading-relaxed pl-4 border-l-2 border-slate-800">{result.analysis.behavioralInsight}</p>
                                    </div>
                                </div>
                            </div>

                             {/* FIGURES GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Figure 1: Calibration Curve */}
                                <Card className="p-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Fig 1. Calibration Curve</h4>
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer>
                                            <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 15 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                                                <XAxis 
                                                    type="number" 
                                                    dataKey="actual" 
                                                    name="Actual" 
                                                    domain={[0, 1]} 
                                                    tickFormatter={(tick) => tick.toFixed(1)}
                                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                                >
                                                    <Label value="Actual Turnout (Ground Truth)" offset={-20} position="insideBottom" fill="#64748b" fontSize={10} />
                                                </XAxis>
                                                <YAxis 
                                                    type="number" 
                                                    dataKey="predicted" 
                                                    name="Predicted" 
                                                    domain={[0, 1]} 
                                                    tickFormatter={(tick) => tick.toFixed(1)}
                                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                                >
                                                    <Label value="Predicted Turnout (Model)" angle={-90} position="insideLeft" fill="#64748b" fontSize={10} offset={5} />
                                                </YAxis>
                                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#10b981" strokeDasharray="3 3" />
                                                <Scatter name="Scenarios" data={result.calibrationData} fill="#0ea5e9">
                                                    {result.calibrationData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill="#0ea5e9" />
                                                    ))}
                                                </Scatter>
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>

                                {/* Figure 2: Parameter Sensitivity */}
                                <Card className="p-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Fig 2. Parameter Sensitivity</h4>
                                    <div className="h-48 w-full">
                                        <ResponsiveContainer>
                                            <BarChart data={sensitivityChartData} layout="vertical" margin={{ top: 5, bottom: 5, left: 0, right: 10 }}>
                                                <CartesianGrid horizontal={false} stroke="#334155" strokeOpacity={0.2} />
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" width={90} tick={{fill: '#e2e8f0', fontSize: 10}} interval={0} />
                                                <Tooltip 
                                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                                    contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9'}}
                                                    formatter={(val: number) => [`${(val * 100).toFixed(2)}%`, 'Impact Score']}
                                                />
                                                <Bar dataKey="sensitivity" barSize={15} radius={[0, 4, 4, 0]}>
                                                    {sensitivityChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index === sensitivityChartData.length - 1 ? '#f97316' : '#64748b'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                 </Card>
                            </div>
                        </div>
                    )}

                    {/* --- DEEP ANALYSIS RESULTS --- */}
                    {deepAnalysisResult && (
                        <div className="space-y-6 animate-fade-in border-t border-slate-800 pt-8">
                             <h2 className="text-xl font-bold text-white border-l-4 border-indigo-500 pl-3">3. Strategic Intervention Analysis</h2>
                             
                             {/* STRATEGY REPORT */}
                             <div className="bg-slate-950 rounded-lg border border-slate-800 font-mono text-sm shadow-2xl overflow-hidden">
                                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                    <span className="ml-2 text-slate-400">nudge_strategy_report.txt</span>
                                </div>
                                <div className="p-6 space-y-6 text-slate-300">
                                    <div>
                                        <p className="text-indigo-400 font-bold mb-1">{'>'} EXECUTIVE SUMMARY</p>
                                        <p className="leading-relaxed pl-4 border-l-2 border-slate-800">{deepAnalysisResult.report.executiveSummary}</p>
                                    </div>
                                     <div>
                                        <p className="text-teal-400 font-bold mb-1">{'>'} STRATEGIC RECOMMENDATIONS</p>
                                        <p className="leading-relaxed pl-4 border-l-2 border-slate-800">{deepAnalysisResult.report.strategicRecommendations}</p>
                                    </div>
                                    <div>
                                        <p className="text-pink-400 font-bold mb-1">{'>'} CONTEXTUAL INSIGHTS</p>
                                        <p className="leading-relaxed pl-4 border-l-2 border-slate-800">{deepAnalysisResult.report.contextualInsights}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Chart 1: Leaderboard */}
                                <Card className="p-4">
                                     <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Nudge Impact Leaderboard (Avg Lift)</h4>
                                     <div className="h-56 w-full">
                                         <ResponsiveContainer>
                                             <BarChart data={deepAnalysisResult.nudgePerformance} layout="vertical" margin={{ top: 5, bottom: 5, left: 40, right: 10 }}>
                                                 <CartesianGrid horizontal={false} stroke="#334155" strokeOpacity={0.2} />
                                                 <XAxis type="number" tickFormatter={(val) => `+${(val*100).toFixed(1)}pp`} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                                 <YAxis type="category" dataKey="nudge" width={100} tick={{fill: '#e2e8f0', fontSize: 10, fontWeight: 600}} interval={0} />
                                                 <Tooltip 
                                                     cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                                     contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9'}}
                                                     formatter={(val: number) => [`+${(val * 100).toFixed(2)}%`, 'Average Lift']}
                                                 />
                                                 <Bar dataKey="avgLift" barSize={20} radius={[0, 4, 4, 0]}>
                                                      {deepAnalysisResult.nudgePerformance.map((entry, index) => (
                                                         <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#6366f1'} />
                                                     ))}
                                                 </Bar>
                                             </BarChart>
                                         </ResponsiveContainer>
                                     </div>
                                </Card>

                                {/* Chart 2: Heatmap */}
                                <Card className="p-4">
                                     <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Contextual Heatmap (Scenario x Nudge)</h4>
                                     <div className="h-56 w-full">
                                         <ResponsiveContainer>
                                             <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                                                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.2} />
                                                 <XAxis type="number" dataKey="x" domain={[-0.5, heatmapData.nudges.length - 0.5]} tick={false} hide />
                                                 <YAxis type="number" dataKey="y" domain={[-0.5, heatmapData.scenarioNames.length - 0.5]} tick={false} hide />
                                                 <Tooltip 
                                                    cursor={{strokeDasharray: '3 3'}}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-slate-900/90 backdrop-blur border border-slate-600 p-3 rounded shadow-xl z-50 min-w-[150px]">
                                                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Scenario</p>
                                                                    <p className="text-slate-200 font-semibold mb-2 text-sm border-b border-slate-700 pb-1">{data.scenario}</p>
                                                                    
                                                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Intervention</p>
                                                                    <p className="text-sky-300 font-medium mb-2 text-sm">{data.nudge}</p>
                                                                    
                                                                    <div className="flex justify-between items-center bg-slate-900 p-1.5 rounded">
                                                                        <span className="text-xs text-slate-400">Impact</span>
                                                                        <span className={`text-sm font-bold ${data.z > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                                            {data.z > 0 ? '+' : ''}{data.z.toFixed(3)}pp
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                 />
                                                 <Scatter data={heatmapData.data} shape="square">
                                                     {heatmapData.data.map((entry, index) => (
                                                         <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={getHeatmapColor(entry.z)} 
                                                            strokeWidth={0} 
                                                        />
                                                     ))}
                                                 </Scatter>
                                             </ScatterChart>
                                         </ResponsiveContainer>
                                     </div>
                                     <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-slate-400">
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#475569] rounded-sm"></div><span>≤0%</span></div>
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#0ea5e9] rounded-sm"></div><span>&lt;1.5%</span></div>
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#6366f1] rounded-sm"></div><span>&lt;3.5%</span></div>
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#a855f7] rounded-sm"></div><span>&lt;6%</span></div>
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#ec4899] rounded-sm"></div><span>6%+</span></div>
                                    </div>
                                </Card>
                                
                                {/* Chart 3: Consistency vs Impact */}
                                <Card className="p-4 md:col-span-2">
                                     <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Efficiency Matrix: Impact vs. Reliability</h4>
                                     <div className="h-64 w-full">
                                         <ResponsiveContainer>
                                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />
                                                <XAxis type="number" dataKey="x" name="Avg Lift" unit="pp" label={{ value: 'Average Lift (Impact)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }} tick={{fill: '#94a3b8'}} />
                                                <YAxis type="number" dataKey="y" name="Volatility" unit="" label={{ value: 'Volatility (Std Dev)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} tick={{fill: '#94a3b8'}} />
                                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                                     if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-slate-900 border border-slate-700 p-2 rounded text-xs shadow-lg">
                                                                <p className="text-white font-bold">{data.nudge}</p>
                                                                <p className="text-sky-400">Avg Lift: {data.x.toFixed(2)}pp</p>
                                                                <p className="text-rose-400">Volatility: {data.y.toFixed(2)}</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }} />
                                                <Scatter name="Nudges" data={consistencyData} fill="#8884d8">
                                                    {consistencyData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                                    ))}
                                                </Scatter>
                                            </ScatterChart>
                                         </ResponsiveContainer>
                                     </div>
                                     <div className="flex justify-between text-[10px] text-slate-500 px-8 -mt-4 relative pointer-events-none">
                                         <span>High Risk / Low Reward</span>
                                         <span>Silver Bullet (High Impact, Reliable)</span>
                                     </div>
                                </Card>

                            </div>
                        </div>
                    )}

                </div>
            </div>
            
            {/* SCENARIO EDITOR MODAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Custom Calibration Scenario">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Context & Nudge */}
                    <div className="space-y-6">
                        <div>
                             <h4 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-1 mb-3">Context & Targets</h4>
                             <InputRow label="Scenario Name">
                                <input type="text" value={newScenarioName} onChange={e => setNewScenarioName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white" placeholder="e.g. City Council 2024" />
                             </InputRow>
                             <InputRow label={`Ground Truth Turnout: ${(newScenarioGT * 100).toFixed(0)}%`}>
                                 <input type="range" min="0" max="1" step="0.01" value={newScenarioGT} onChange={e => setNewScenarioGT(parseFloat(e.target.value))} className="w-full accent-sky-500" />
                             </InputRow>
                             <div className="grid grid-cols-2 gap-4">
                                <InputRow label={`Competitiveness: ${newScenarioComp.toFixed(2)}`}>
                                    <input type="range" min="0" max="1" step="0.05" value={newScenarioComp} onChange={e => setNewScenarioComp(parseFloat(e.target.value))} className="w-full accent-slate-400" />
                                </InputRow>
                                <InputRow label={`Voting Cost: ${newScenarioCost.toFixed(2)}`}>
                                    <input type="range" min="0" max="1" step="0.05" value={newScenarioCost} onChange={e => setNewScenarioCost(parseFloat(e.target.value))} className="w-full accent-slate-400" />
                                </InputRow>
                             </div>
                        </div>

                        <div>
                             <h4 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-1 mb-3">Active Intervention (Nudge)</h4>
                             <InputRow label="Nudge Type">
                                 <select value={newScenarioNudge} onChange={e => setNewScenarioNudge(e.target.value as NudgeType)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white">
                                     {Object.values(NudgeType).map(n => <option key={n} value={n}>{n}</option>)}
                                 </select>
                             </InputRow>
                             <NudgeParamsEditor 
                                nudgeType={newScenarioNudge} 
                                params={newScenarioNudgeParams} 
                                setParams={setNewScenarioNudgeParams}
                             />
                        </div>
                    </div>

                    {/* Right Column: Demographics */}
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar bg-slate-900/30 p-4 rounded-lg border border-slate-800/50">
                         <h4 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-1 mb-3">Agent Demographics</h4>
                         
                         <div className="space-y-4">
                            <InputRow label={`Education Skew: ${newScenarioEduSkew.toFixed(1)}`}>
                                <input type="range" min="0.1" max="3.0" step="0.1" value={newScenarioEduSkew} onChange={e => setNewScenarioEduSkew(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                                <div className="flex justify-between text-[10px] text-slate-600"><span>Low Edu</span><span>High Edu</span></div>
                            </InputRow>
                            <InputRow label={`Civic Duty Skew: ${newScenarioDutySkew.toFixed(1)}`}>
                                <input type="range" min="0.1" max="3.0" step="0.1" value={newScenarioDutySkew} onChange={e => setNewScenarioDutySkew(parseFloat(e.target.value))} className="w-full accent-emerald-500" />
                                <div className="flex justify-between text-[10px] text-slate-600"><span>Apathetic</span><span>Dutiful</span></div>
                            </InputRow>
                             <InputRow label={`Urban Probability: ${(newScenarioUrbanProb * 100).toFixed(0)}%`}>
                                <input type="range" min="0" max="1" step="0.05" value={newScenarioUrbanProb} onChange={e => setNewScenarioUrbanProb(parseFloat(e.target.value))} className="w-full accent-purple-500" />
                                <div className="flex justify-between text-[10px] text-slate-600"><span>Rural</span><span>Urban</span></div>
                            </InputRow>
                            <InputRow label={`Past Vote Probability: ${(newScenarioPastVoteProb * 100).toFixed(0)}%`}>
                                <input type="range" min="0" max="1" step="0.05" value={newScenarioPastVoteProb} onChange={e => setNewScenarioPastVoteProb(parseFloat(e.target.value))} className="w-full accent-blue-500" />
                                <div className="flex justify-between text-[10px] text-slate-600"><span>New Voters</span><span>Regulars</span></div>
                            </InputRow>
                            <InputRow label={`Social Pressure Sensitivity: ${newScenarioSocialSkew.toFixed(1)}`}>
                                <input type="range" min="0.1" max="3.0" step="0.1" value={newScenarioSocialSkew} onChange={e => setNewScenarioSocialSkew(parseFloat(e.target.value))} className="w-full accent-pink-500" />
                                <div className="flex justify-between text-[10px] text-slate-600"><span>Independent</span><span>Conformist</span></div>
                            </InputRow>
                             <InputRow label={`Risk Aversion Skew: ${newScenarioRiskSkew.toFixed(1)}`}>
                                <input type="range" min="0.1" max="3.0" step="0.1" value={newScenarioRiskSkew} onChange={e => setNewScenarioRiskSkew(parseFloat(e.target.value))} className="w-full accent-orange-500" />
                                <div className="flex justify-between text-[10px] text-slate-600"><span>Risk Taker</span><span>Cautious</span></div>
                            </InputRow>
                             <InputRow label={`Partisan Strength Skew: ${newScenarioPartisanSkew.toFixed(1)}`}>
                                <input type="range" min="0.1" max="3.0" step="0.1" value={newScenarioPartisanSkew} onChange={e => setNewScenarioPartisanSkew(parseFloat(e.target.value))} className="w-full accent-red-500" />
                                <div className="flex justify-between text-[10px] text-slate-600"><span>Neutral</span><span>Partisan</span></div>
                            </InputRow>
                         </div>
                    </div>
                 </div>
                 <div className="flex justify-end mt-6 pt-4 border-t border-slate-700">
                     <button onClick={() => setIsModalOpen(false)} className="mr-3 px-4 py-2 text-slate-400 hover:text-white transition">Cancel</button>
                     <button onClick={handleAddScenario} disabled={!newScenarioName} className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded">Add Scenario</button>
                 </div>
            </Modal>
        </div>
    );
};

export default ModelTuner;