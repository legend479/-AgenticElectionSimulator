
import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/ui/Card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

// --- MINI DDM SIMULATOR COMPONENT ---
const MiniDDMSimulation = () => {
    const [drift, setDrift] = useState(0.2);
    const [threshold, setThreshold] = useState(1.5);
    const [paths, setPaths] = useState<{t: number, x: number}[][]>([]);
    const [simulating, setSimulating] = useState(false);

    const runSimulation = () => {
        setSimulating(true);
        const newPaths: {t: number, x: number}[][] = [];
        
        // Generate 3 paths
        for(let p=0; p<3; p++) {
            const path = [{t: 0, x: 0}];
            let x = 0;
            let t = 0;
            const dt = 0.1;
            const noise = 1.0;

            while (Math.abs(x) < threshold && t < 20) {
                t += dt;
                const dW = (Math.random() - 0.5) * Math.sqrt(12 * dt);
                x += drift * dt + noise * dW;
                path.push({t, x});
            }
            newPaths.push(path);
        }
        setPaths(newPaths);
        setTimeout(() => setSimulating(false), 500);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-900/50 p-6 rounded-xl border border-slate-800 mt-6">
            <div className="lg:col-span-1 space-y-6">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-sky-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                    Parameters
                </h3>
                <div>
                    <label className="text-sm font-bold text-slate-300 block mb-1">Drift Rate (μ): {drift}</label>
                    <input type="range" min="-0.5" max="0.5" step="0.05" value={drift} onChange={e => setDrift(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                    <p className="text-xs text-slate-500 mt-1">Positive = Pro-Vote, Negative = Anti-Vote</p>
                </div>
                <div>
                    <label className="text-sm font-bold text-slate-300 block mb-1">Threshold (a): {threshold}</label>
                    <input type="range" min="0.5" max="3.0" step="0.1" value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                    <p className="text-xs text-slate-500 mt-1">Distance to decision boundary (Caution).</p>
                </div>
                <button 
                    onClick={runSimulation} 
                    disabled={simulating}
                    className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-md transition shadow-lg shadow-sky-500/20"
                >
                    {simulating ? 'Thinking...' : 'Simulate Decision'}
                </button>
            </div>
            <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800/50 relative p-2">
                 <div className="absolute top-2 right-2 z-10 bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-400 border border-slate-700">
                     Visualization
                 </div>
                 <div className="h-64 w-full">
                    <ResponsiveContainer>
                        <LineChart margin={{ top: 20, right: 10, bottom: 20, left: 0 }}>
                             <ReferenceLine y={threshold} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'VOTE', fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }} />
                             <ReferenceLine y={-threshold} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'ABSTAIN', fill: '#f43f5e', fontSize: 10, position: 'insideBottomLeft' }} />
                             <ReferenceLine y={0} stroke="#475569" strokeDasharray="5 5" />
                             <XAxis type="number" dataKey="t" hide domain={[0, 20]}/>
                             <YAxis type="number" hide domain={[-threshold*1.2, threshold*1.2]} />
                             {paths.map((path, i) => (
                                 <Line key={i} data={path} type="basis" dataKey="x" stroke={i === 0 ? "#fbbf24" : "#94a3b8"} strokeWidth={i === 0 ? 3 : 1} dot={false} isAnimationActive={true} animationDuration={1000} />
                             ))}
                        </LineChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </div>
    );
};

const Formula: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-slate-950/50 border border-slate-700 rounded-md p-4 my-4 text-center text-xl text-sky-300 font-mono overflow-x-auto shadow-inner">
        {children}
    </div>
);

const DDMModelPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        <header className="text-center mb-10 py-8 bg-gradient-to-b from-slate-900 to-transparent rounded-2xl border-b border-slate-800/50">
            <div className="inline-flex items-center justify-center p-3 bg-purple-900/30 rounded-full mb-4 border border-purple-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">Drift-Diffusion Model</h1>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">Modeling Decisions as an Accumulation of Evidence</p>
        </header>

        <Card className="p-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                Core Concept
            </h2>
            <p className="text-slate-300 leading-relaxed text-lg">
                The Drift-Diffusion Model (DDM) frames decision-making as a dynamic process of evidence accumulation. Instead of a static calculation, imagine the agent's mind gathering "bits" of evidence over time.
            </p>
             <p className="text-slate-300 leading-relaxed mt-4 text-lg">
                Evidence fluctuates noisily but drifts towards a boundary. Once enough evidence accumulates to hit a threshold, the decision is made. This captures <span className="font-semibold text-purple-300">Speed vs. Accuracy</span> trade-offs that static models miss.
            </p>
        </Card>

         <section>
             <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Interactive Simulator
            </h2>
            <p className="text-slate-400 mb-4">Simulate the random walk of a decision. Increase drift to decide faster; increase threshold to decide more carefully.</p>
            <MiniDDMSimulation />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
                <h2 className="text-xl font-bold text-purple-400 mb-3 flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                    Mathematical Formulation
                </h2>
                <p className="text-sm text-slate-400 mb-2">Probability of hitting 'Vote' (Boundary a):</p>
                <Formula>P(vote) = (1 - e<sup>-2μz/σ²</sup>) / (1 - e<sup>-2μa/σ²</sup>)</Formula>
                <p className="text-sm text-slate-400 mt-4">
                   This formula is the analytical solution to the "First Passage Time" problem for a biased random walk.
                </p>
            </Card>

             <Card className="p-6">
                <h2 className="text-xl font-bold text-purple-400 mb-3 flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    Variables Defined
                </h2>
                <ul className="space-y-3 text-sm text-slate-300">
                    <li><strong className="text-white">μ (Drift Rate):</strong> Speed/Direction. Positive = Vote. Negative = Abstain.</li>
                    <li><strong className="text-purple-300">a (Threshold):</strong> Caution. Higher values require more evidence to decide.</li>
                    <li><strong className="text-white">z (Bias):</strong> Starting point. Are they biased before thinking?</li>
                    <li><strong className="text-white">σ (Noise):</strong> Randomness. Variability in thought process.</li>
                </ul>
            </Card>
        </div>
    </div>
  );
};

export default DDMModelPage;
