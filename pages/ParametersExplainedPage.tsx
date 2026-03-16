
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const Param: React.FC<{ name: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ name, children, icon }) => (
    <div className="p-4 bg-slate-900/40 rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors">
        <div className="flex items-start gap-3">
            {icon && <div className="mt-1 text-sky-500">{icon}</div>}
            <div>
                 <strong className="font-bold text-slate-200 block mb-1 text-lg">{name}</strong>
                 <p className="text-sm text-slate-400 leading-relaxed">{children}</p>
            </div>
        </div>
    </div>
);

// --- SKEW VISUALIZER ---
const SkewVisualizer = () => {
    const [skew, setSkew] = useState(1); // 1 = uniform ish
    
    const generateData = (s: number) => {
        const data = [];
        for(let i=0; i<=20; i++) {
            const x = i / 20; // 0 to 1
            // Approx Beta-like distribution logic for visual
            // s > 1 skews towards 1 (High)
            // s < 1 skews towards 0 (Low)
            let density;
            if (s === 1) density = 1; 
            else if (s > 1) density = Math.pow(x, s-1); 
            else density = Math.pow(1-x, (1/s)-1);
            
            data.push({ x, y: density });
        }
        return data;
    };

    const data = generateData(skew);

    return (
        <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 mt-4">
            <h3 className="text-md font-bold text-white mb-4">Understanding "Skew" Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                    <p className="text-sm text-slate-400 mb-4">
                        Many agent parameters use a "skew" value to determine the population distribution.
                        Slide to see how the population shifts.
                    </p>
                    <div className="mb-6">
                        <label className="text-sm font-bold text-slate-300 block mb-1">Skew Value: {skew}</label>
                        <input type="range" min="0.2" max="3.0" step="0.1" value={skew} onChange={e => setSkew(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>Low (Most agents ~0)</span>
                            <span>Uniform</span>
                            <span>High (Most agents ~1)</span>
                        </div>
                    </div>
                </div>
                <div className="h-40 w-full bg-slate-900 rounded border border-slate-800">
                     <ResponsiveContainer>
                         <AreaChart data={data} margin={{top: 10, bottom: 0}}>
                             <defs>
                                <linearGradient id="colorSkew" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                             <Area type="monotone" dataKey="y" stroke="#06b6d4" fill="url(#colorSkew)" />
                             <XAxis hide />
                             <YAxis hide />
                         </AreaChart>
                     </ResponsiveContainer>
                     <p className="text-center text-xs text-slate-500 mt-1">Population Density</p>
                </div>
            </div>
        </div>
    );
};


const ParametersExplainedPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
         <header className="text-center mb-10 py-8 bg-gradient-to-b from-slate-900 to-transparent rounded-2xl border-b border-slate-800/50">
             <div className="inline-flex items-center justify-center p-3 bg-emerald-900/30 rounded-full mb-4 border border-emerald-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">Parameter Guide</h1>
            <p className="mt-4 text-lg text-slate-400">The knobs and dials that control the simulation engine.</p>
        </header>

        <section>
             <h2 className="text-2xl font-bold text-white mb-6 pl-2 border-l-4 border-emerald-500">Global Context</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Param name="Competitiveness" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}>
                     How close the race is (1.0 = Dead Heat, 0.1 = Landslide). Drives the "p" (pivotality) term.
                </Param>
                <Param name="Voting Cost" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
                     Baseline effort required (travel, lines, info). Higher values discourage turnout.
                </Param>
                <Param name="Ground Truth" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
                     Real-world turnout for the scenario. Used as a target to grade the model's accuracy.
                </Param>
             </div>
        </section>

        <section>
            <h2 className="text-2xl font-bold text-white mb-6 pl-2 border-l-4 border-blue-500">Agent Generation</h2>
            <SkewVisualizer />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Param name="Education Skew">Controls avg. education. Impacts information costs and cognitive style.</Param>
                <Param name="Civic Duty Skew">Prevalence of "Duty". The moral obligation to vote.</Param>
                <Param name="Risk Aversion Skew">Tolerance for uncertainty. Affects decision thresholds.</Param>
                <Param name="Social Pressure Skew">Sensitivity to peer norms. Higher in rural/tight-knit areas.</Param>
            </div>
        </section>
        
        <section>
             <h2 className="text-2xl font-bold text-white mb-6 pl-2 border-l-4 border-purple-500">Model Physics (Beta Weights)</h2>
             <p className="text-slate-400 mb-4">The internal "Beta" (β) weights determine the importance of each factor in the math.</p>
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="p-5 bg-slate-900/30">
                    <h3 className="text-lg font-bold text-sky-400 mb-3">Utility</h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li><strong>β (pB):</strong> Weight of Winning.</li>
                        <li><strong>β (Cost):</strong> Weight of Effort (Negative).</li>
                        <li><strong>β (Duty):</strong> Weight of Moral Obligation.</li>
                        <li><strong>Noise:</strong> Randomness in choice.</li>
                    </ul>
                </Card>
                <Card className="p-5 bg-slate-900/30">
                    <h3 className="text-lg font-bold text-purple-400 mb-3">Drift-Diffusion</h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li><strong>Base Drift (μ):</strong> Default urge to vote.</li>
                        <li><strong>Threshold (a):</strong> Caution level.</li>
                        <li><strong>Start Bias (z):</strong> Pre-conceived intent.</li>
                    </ul>
                </Card>
                 <Card className="p-5 bg-slate-900/30">
                    <h3 className="text-lg font-bold text-indigo-400 mb-3">Dual-System</h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li><strong>S1 Weights:</strong> Power of Intuition/Habit.</li>
                        <li><strong>S2 Weights:</strong> Power of Logic/Cost.</li>
                        <li><strong>λ (Lambda):</strong> Balance between S1/S2.</li>
                    </ul>
                </Card>
             </div>
        </section>
    </div>
  );
};

export default ParametersExplainedPage;
