
import React, { useState } from 'react';
import Card from '../components/ui/Card';

// --- COGNITIVE BALANCE COMPONENT ---
const SystemBalancer = () => {
    const [s1Activation, setS1Activation] = useState(0.8); // High Habit
    const [s2Utility, setS2Utility] = useState(0.2); // High Cost (Low prob)
    const [lambda, setLambda] = useState(0.5); // Balanced

    const finalProb = lambda * s1Activation + (1 - lambda) * s2Utility;

    return (
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 mt-6">
             <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-sky-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                Cognitive Balance Playground
            </h3>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                {/* System 1 Output */}
                <div className="w-full md:w-1/3 bg-blue-900/20 p-4 rounded-lg border border-blue-800/50 text-center">
                    <h4 className="text-blue-300 font-bold mb-2">System 1 (Heuristic)</h4>
                    <p className="text-xs text-slate-400 mb-3">Pattern Matching & Impulse</p>
                    <input type="range" min="0" max="1" step="0.1" value={s1Activation} onChange={e => setS1Activation(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                    <p className="mt-2 font-mono text-blue-200">Impulse: {(s1Activation * 100).toFixed(0)}%</p>
                </div>

                 {/* Lambda Control */}
                <div className="w-full md:w-1/3 text-center relative">
                     <label className="block text-slate-300 font-bold mb-2">Weighting (λ)</label>
                     <div className="flex justify-between text-xs text-slate-500 mb-1 px-1">
                        <span>Deliberate (S2)</span>
                        <span>Automatic (S1)</span>
                     </div>
                     <input type="range" min="0" max="1" step="0.1" value={lambda} onChange={e => setLambda(parseFloat(e.target.value))} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-white" />
                     <p className="mt-2 text-sm text-white font-mono">λ = {lambda.toFixed(1)}</p>
                </div>

                {/* System 2 Output */}
                <div className="w-full md:w-1/3 bg-purple-900/20 p-4 rounded-lg border border-purple-800/50 text-center">
                    <h4 className="text-purple-300 font-bold mb-2">System 2 (Utility)</h4>
                    <p className="text-xs text-slate-400 mb-3">Rational Calculation (Cost/Benefit)</p>
                    <input type="range" min="0" max="1" step="0.1" value={s2Utility} onChange={e => setS2Utility(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                    <p className="mt-2 font-mono text-purple-200">Conclusion: {(s2Utility * 100).toFixed(0)}%</p>
                </div>
            </div>

            {/* Final Result Bar */}
             <div className="w-full space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="flex justify-between text-sm text-slate-300 font-medium">
                    <span>Final Decision Probability</span>
                    <span className="text-sky-400 font-bold">{(finalProb * 100).toFixed(1)}%</span>
                </div>
                <div className="h-8 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-sky-500 to-purple-500 transition-all duration-300 ease-out"
                        style={{ width: `${finalProb * 100}%` }}
                    />
                </div>
                <p className="text-xs text-slate-500 text-center mt-1">
                    Formula: P = λ(S1) + (1-λ)(S2)
                </p>
            </div>
        </div>
    );
};


const Formula: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-slate-950/50 border border-slate-700 rounded-md p-4 my-4 text-center text-xl text-sky-300 font-mono overflow-x-auto shadow-inner">
        {children}
    </div>
);

const DualSystemModelPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
         <header className="text-center mb-10 py-8 bg-gradient-to-b from-slate-900 to-transparent rounded-2xl border-b border-slate-800/50">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-900/30 rounded-full mb-4 border border-indigo-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">Dual-System Model</h1>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">The Interplay Between Intuitive Impulse and Rational Deliberation</p>
        </header>

        <Card className="p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <h2 className="text-2xl font-bold text-indigo-400 mb-4 flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                Core Concept: Two Distinct Minds
            </h2>
            <p className="text-slate-300 leading-relaxed text-lg">
                This model improves upon the standard "weighted sum" approach by simulating two distinct internal cognitive architectures for each agent.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-slate-900/50 p-4 rounded-lg border-l-4 border-blue-500">
                    <strong className="text-blue-400 block mb-2 text-lg">System 1: Heuristic Activation</strong>
                    <p className="text-slate-400 text-sm mb-2">
                        <b>The "Fast" Mind.</b> It doesn't calculate probabilities. It reacts to cues.
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                        <li>Driven by <b>Associative Memory</b> (Habit + Affect).</li>
                        <li>Ignores Cost.</li>
                        <li>Creates an "Impulse" to vote.</li>
                    </ul>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg border-l-4 border-purple-500">
                    <strong className="text-purple-400 block mb-2 text-lg">System 2: Rational Utility</strong>
                    <p className="text-slate-400 text-sm mb-2">
                        <b>The "Slow" Mind.</b> It runs the math.
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                        <li>Driven by <b>Calculus of Voting</b> (P*B - C + D).</li>
                        <li>Highly sensitive to Cost.</li>
                        <li>Creates a "Conclusion" based on logic.</li>
                    </ul>
                </div>
            </div>
        </Card>

        <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Interactive Simulator
            </h2>
            <p className="text-slate-400 mb-4">Adjust the strength of each system and the "Lambda" weight to see how the final decision is formed.</p>
            <SystemBalancer />
        </section>

        <Card className="p-8">
             <h2 className="text-2xl font-bold text-indigo-400 mb-3 flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                The Calculation
            </h2>
            <p className="text-slate-300 mt-2">The final probability is a weighted average of the two systems' outputs:</p>
            <Formula>P(Vote) = λ · Activation(S1) + (1 - λ) · Utility(S2)</Formula>
             <ul className="space-y-4 mt-6 text-slate-300">
                <li>
                    <strong className="font-semibold text-white">λ (Lambda):</strong> The Cognitive Control parameter. 
                    <span className="block text-sm text-slate-400 mt-1 ml-4">
                        If λ is high (near 1), the agent is impulsive (System 1 dominant). If λ is low (near 0), the agent is calculating (System 2 dominant). Factors like <span className="text-sky-300">Education</span> and <span className="text-sky-300">Risk Aversion</span> modify λ for each agent.
                    </span>
                </li>
            </ul>
        </Card>
    </div>
  );
};

export default DualSystemModelPage;
