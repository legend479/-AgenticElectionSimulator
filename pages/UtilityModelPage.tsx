
import React, { useState } from 'react';
import Card from '../components/ui/Card';

const VariableSlider: React.FC<{ label: string; value: number; onChange: (val: number) => void; min: number; max: number; step: number; description: string; color?: string }> = ({ label, value, onChange, min, max, step, description, color = "accent-sky-500" }) => (
    <div className="mb-4">
        <div className="flex justify-between items-baseline mb-1">
            <label className="text-sm font-bold text-slate-200">{label}</label>
            <span className={`text-sm font-mono ${color.replace('accent-', 'text-')}`}>{value.toFixed(2)}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className={`w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer ${color}`}
        />
        <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
);

const UtilityCalculator = () => {
    const [p, setP] = useState(0.5);
    const [B, setB] = useState(1.0);
    const [C, setC] = useState(0.5);
    const [D, setD] = useState(0.5);
    
    // Simple logistic function
    const utility = (p * B) - C + D;
    const prob = 1 / (1 + Math.exp(-utility / 0.5)); // noise = 0.5

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-900/50 p-6 rounded-xl border border-slate-800 mt-6">
            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-sky-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                    Adjust Variables
                </h3>
                <VariableSlider label="P (Pivotality)" value={p} onChange={setP} min={0} max={1} step={0.01} description="Probability your vote decides the election." />
                <VariableSlider label="B (Benefit)" value={B} onChange={setB} min={0} max={5} step={0.1} description="How much you care who wins." />
                <VariableSlider label="C (Cost)" value={C} onChange={setC} min={0} max={5} step={0.1} description="Effort required to vote (Negative impact)." color="accent-rose-500" />
                <VariableSlider label="D (Duty)" value={D} onChange={setD} min={0} max={5} step={0.1} description="Sense of civic obligation." />
            </div>
            <div className="flex flex-col justify-center items-center bg-slate-950 p-6 rounded-xl border border-slate-800/50">
                <h3 className="text-slate-400 font-semibold mb-6 uppercase tracking-widest text-xs">Resulting Prediction</h3>
                
                <div className="text-center mb-8">
                     <p className="text-sm text-slate-500 mb-1">Calculated Utility Score</p>
                     <p className={`text-3xl font-mono font-bold ${utility > 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                        {utility > 0 ? '+' : ''}{utility.toFixed(2)}
                     </p>
                     <p className="text-xs text-slate-600 mt-1">U = ({p.toFixed(2)} × {B.toFixed(1)}) - {C.toFixed(1)} + {D.toFixed(1)}</p>
                </div>

                <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                        <span>Abstain</span>
                        <span>Vote Probability: {(prob * 100).toFixed(0)}%</span>
                        <span>Vote</span>
                    </div>
                    <div className="h-6 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                        <div 
                            className={`h-full transition-all duration-300 ease-out ${prob > 0.5 ? 'bg-gradient-to-r from-sky-600 to-cyan-400' : 'bg-gradient-to-r from-rose-900 to-rose-700'}`}
                            style={{ width: `${prob * 100}%` }}
                        />
                        {/* Threshold Marker */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-white/30 left-1/2"></div>
                    </div>
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

const UtilityModelPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        <header className="text-center mb-10 py-8 bg-gradient-to-b from-slate-900 to-transparent rounded-2xl border-b border-slate-800/50">
            <div className="inline-flex items-center justify-center p-3 bg-sky-900/30 rounded-full mb-4 border border-sky-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">Extended Utility Model</h1>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">A Rational Choice Framework with Behavioral Twists</p>
        </header>

        <Card className="p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <h2 className="text-2xl font-bold text-sky-400 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Core Concept
            </h2>
            <p className="text-slate-300 leading-relaxed text-lg">
                The Extended Utility Model is based on the classic rational choice theory of voting, often called the "calculus of voting." It posits that a rational individual will vote if the expected benefit of their preferred candidate winning outweighs the costs of voting. However, the basic model often predicts that almost no one should vote, a paradox it fails to resolve.
            </p>
            <div className="mt-6 p-4 bg-slate-800/50 border-l-4 border-sky-500 rounded-r-lg">
                <p className="text-slate-300 italic">
                    "I vote not just because it changes the outcome, but because it defines who I am."
                </p>
            </div>
            <p className="text-slate-300 leading-relaxed mt-6">
                This "extended" version incorporates key behavioral factors. It adds terms for intrinsic psychological benefits: <span className="font-semibold text-sky-300">civic duty</span>, the power of <span className="font-semibold text-sky-300">habit</span>, and <span className="font-semibold text-sky-300">social pressure</span>. By including these, the model explains why people turn out even when their ballot is unlikely to be pivotal.
            </p>
        </Card>

        <section>
             <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Interactive Playground
            </h2>
            <p className="text-slate-400 mb-4">Experiment with the variables below to see how the "Calculus of Voting" determines the probability of turnout.</p>
            <UtilityCalculator />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
                 <h2 className="text-xl font-bold text-sky-400 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    The Equation
                </h2>
                <p className="text-sm text-slate-400 mb-2">Total Utility (U) Calculation:</p>
                <Formula>U = (P × B) - C + D + S + H</Formula>
                <p className="text-sm text-slate-400 mt-4">
                    The final probability is derived by passing <strong>U</strong> through a logistic function, converting the raw score into a percentage (0-100%).
                </p>
            </Card>

            <Card className="p-6">
                 <h2 className="text-xl font-bold text-sky-400 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    Variables Defined
                </h2>
                <ul className="space-y-3 text-sm text-slate-300">
                    <li><strong className="text-white">P × B:</strong> Instrumental Benefit. (Chance vote matters × Stakes).</li>
                    <li><strong className="text-rose-400">C:</strong> Cost. Time, effort, and cognitive load.</li>
                    <li><strong className="text-sky-300">D:</strong> Civic Duty. Intrinsic satisfaction from doing one's part.</li>
                    <li><strong className="text-white">S:</strong> Social Pressure. Reward/Punishment from peers.</li>
                    <li><strong className="text-white">H:</strong> Habit. Inertia from previous elections.</li>
                </ul>
            </Card>
        </div>
    </div>
  );
};

export default UtilityModelPage;
