
import React, { useEffect, useState } from 'react';

const MathExpr: React.FC<{ children: string; block?: boolean }> = ({ children, block }) => {
  const parseLatex = (text: string) => {
    let t = text
      .replace(/\\beta/g, 'β')
      .replace(/\\lambda/g, 'λ')
      .replace(/\\mu/g, 'μ')
      .replace(/\\sigma/g, 'σ')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\theta/g, 'θ')
      .replace(/\\epsilon/g, 'ε')
      .replace(/\\cdot/g, '·')
      .replace(/\\sqrt/g, '√')
      .replace(/\\Sigma/g, 'Σ')
      .replace(/\\in/g, '∈')
      .replace(/\\to/g, '→')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥')
      .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
      .replace(/_([a-zA-Z0-9]+)/g, '<sub>$1</sub>')
      .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
      .replace(/\^([a-zA-Z0-9]+)/g, '<sup>$1</sup>');
      
    return t;
  };

  return (
    <span 
        className={`font-serif inline-block ${
            block 
            ? 'block text-center my-6 text-xl text-sky-100 bg-slate-900/50 py-4 px-6 rounded border border-slate-800/50 shadow-sm' 
            : 'text-slate-200 bg-slate-800/30 px-1.5 py-0.5 rounded mx-0.5 border border-slate-700/50'
        }`}
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
        dangerouslySetInnerHTML={{ __html: parseLatex(children) }} 
    />
  );
};

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 font-mono text-sm text-emerald-400 overflow-x-auto my-6 shadow-inner relative group transition-all hover:border-slate-700">
        <div className="absolute top-2 right-2 flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
        </div>
        <div className="mt-2">
             {children}
        </div>
    </div>
);

const Table: React.FC<{ headers: string[]; rows: (string | React.ReactNode)[][] }> = ({ headers, rows }) => (
    <div className="overflow-hidden my-8 border border-slate-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
        <table className="min-w-full divide-y divide-slate-800 bg-slate-900/40">
            <thead className="bg-slate-900">
                <tr>
                    {headers.map((h, i) => (
                        <th key={i} scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {h}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-900/20">
                {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                        {row.map((cell, j) => (
                            <td key={j} className={`px-6 py-4 whitespace-normal ${j === 0 ? 'font-semibold text-sky-400' : 'text-slate-300'}`}>
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const Callout: React.FC<{ title: string; children: React.ReactNode; type?: 'info' | 'warning' }> = ({ title, children, type = 'info' }) => (
    <div className={`my-8 p-5 rounded-r-lg border-l-4 bg-gradient-to-r ${type === 'info' ? 'from-sky-900/20 to-slate-900/10 border-sky-500' : 'from-amber-900/20 to-slate-900/10 border-amber-500'} shadow-sm`}>
        <h4 className={`text-sm font-bold uppercase tracking-wide mb-2 flex items-center ${type === 'info' ? 'text-sky-400' : 'text-amber-400'}`}>
            {type === 'info' ? (
                 <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            ) : (
                 <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            )}
            {title}
        </h4>
        <div className="text-slate-300 leading-relaxed">
            {children}
        </div>
    </div>
);

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
    <section id={id} className="mb-20 scroll-mt-32 group">
        <div className="flex items-center mb-6 border-b border-slate-800 pb-4">
             <h2 className="text-3xl font-extrabold text-white tracking-tight group-hover:text-sky-400 transition-colors duration-300">
                {title}
            </h2>
        </div>
        <div className="text-slate-400 leading-8 text-base lg:text-lg space-y-6 font-light">
            {children}
        </div>
    </section>
);

const SubHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="text-xl font-bold text-slate-100 mt-12 mb-6 flex items-center">
        <span className="w-1.5 h-6 bg-sky-500 rounded-full mr-3 shadow-[0_0_10px_rgba(14,165,233,0.5)]"></span>
        {children}
    </h3>
);

// --- VISUAL ILLUSTRATIONS (SVGs) ---

const DiagramDriftDiffusion = () => (
    <div className="my-8 p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-semibold">Figure 1: Stochastic Accumulation Process</p>
        <svg width="400" height="150" viewBox="0 0 400 150" className="w-full max-w-md">
            {/* Thresholds */}
            <line x1="50" y1="20" x2="350" y2="20" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
            <text x="360" y="25" fill="#10b981" fontSize="10">Vote (a)</text>
            <line x1="50" y1="130" x2="350" y2="130" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" />
            <text x="360" y="135" fill="#f43f5e" fontSize="10">Abstain (0)</text>
            
            {/* Path */}
            <path d="M50 75 C 80 65, 100 85, 130 70 C 160 55, 180 65, 210 50 C 240 35, 260 45, 290 25" fill="none" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="50" cy="75" r="3" fill="#94a3b8" />
            <text x="35" y="78" fill="#94a3b8" fontSize="10">z</text>
            
            {/* Arrow */}
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                </marker>
            </defs>
            <line x1="50" y1="75" x2="100" y2="55" stroke="#475569" strokeWidth="1" markerEnd="url(#arrowhead)" strokeDasharray="2 2" />
            <text x="80" y="50" fill="#475569" fontSize="10">Drift (μ)</text>
        </svg>
    </div>
);

const DiagramDualSystem = () => (
    <div className="my-8 p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-semibold">Figure 2: Cognitive Arbitration Architecture</p>
        <svg width="400" height="120" viewBox="0 0 400 120" className="w-full max-w-md">
            {/* System 1 */}
            <rect x="20" y="40" width="100" height="40" rx="4" fill="#1e3a8a" stroke="#3b82f6" />
            <text x="70" y="65" fill="#bfdbfe" fontSize="12" textAnchor="middle" fontWeight="bold">System 1</text>
            <text x="70" y="100" fill="#60a5fa" fontSize="10" textAnchor="middle">Fast / Intuitive</text>

            {/* System 2 */}
            <rect x="280" y="40" width="100" height="40" rx="4" fill="#4c1d95" stroke="#8b5cf6" />
            <text x="330" y="65" fill="#ddd6fe" fontSize="12" textAnchor="middle" fontWeight="bold">System 2</text>
            <text x="330" y="100" fill="#a78bfa" fontSize="10" textAnchor="middle">Slow / Rational</text>

            {/* Arbiter */}
            <circle cx="200" cy="60" r="15" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
            <text x="200" y="64" fill="#fff" fontSize="14" textAnchor="middle" fontWeight="bold">λ</text>
            
            {/* Connectors */}
            <line x1="120" y1="60" x2="185" y2="60" stroke="#64748b" strokeWidth="2" />
            <line x1="215" y1="60" x2="280" y2="60" stroke="#64748b" strokeWidth="2" />
            
            {/* Weights */}
            <text x="150" y="50" fill="#94a3b8" fontSize="10" textAnchor="middle">w = λ</text>
            <text x="250" y="50" fill="#94a3b8" fontSize="10" textAnchor="middle">w = 1-λ</text>
        </svg>
    </div>
);


const DocumentationPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState('overview');

    useEffect(() => {
        const handleScroll = () => {
            const sections = ['overview', 'agent-architecture', 'models', 'nudges', 'tuning'];
            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top >= 0 && rect.top <= 300) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const NavLink: React.FC<{ id: string; label: string }> = ({ id, label }) => (
        <a 
            href={`#${id}`} 
            className={`block px-4 py-2.5 text-sm rounded-lg transition-all duration-200 group flex items-center ${
                activeSection === id 
                ? 'bg-sky-500/10 text-sky-400 font-semibold translate-x-2 border-r-2 border-sky-500' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 hover:translate-x-1'
            }`}
        >
             <span className={`w-1.5 h-1.5 rounded-full mr-3 transition-colors ${activeSection === id ? 'bg-sky-400' : 'bg-slate-600 group-hover:bg-slate-400'}`}></span>
            {label}
        </a>
    );

    return (
        <div className="max-w-screen-xl mx-auto animate-fade-in px-4 md:px-8">
            <header className="mb-16 py-12 border-b border-slate-800/60 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-sky-900/10 to-transparent pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 mb-6">
                        Technical Reference v2.1
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
                        Simulation <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">Architecture</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl leading-relaxed">
                        A comprehensive guide to the stochastic kernels, agentic decision matrices, and the mathematical frameworks powering the engine.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Sticky Sidebar */}
                <aside className="hidden lg:block lg:col-span-3 relative">
                    <div className="sticky top-28 space-y-8">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-4">Contents</p>
                            <nav className="space-y-1 border-l border-slate-800 ml-2 pl-2">
                                <NavLink id="overview" label="System Overview" />
                                <NavLink id="agent-architecture" label="Agent Architecture" />
                                <NavLink id="models" label="Behavioral Models" />
                                <NavLink id="nudges" label="Nudge Mechanics" />
                                <NavLink id="tuning" label="Calibration Engine" />
                            </nav>
                        </div>
                        
                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl">
                            <p className="text-xs text-slate-500 mb-3 font-semibold uppercase">Model Status</p>
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-slate-300">Utility Kernel</span>
                                <span className="text-emerald-400 font-mono text-xs">Online</span>
                            </div>
                             <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-slate-300">DDM Kernel</span>
                                <span className="text-emerald-400 font-mono text-xs">Online</span>
                            </div>
                             <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-300">Dual-System</span>
                                <span className="text-sky-400 font-mono text-xs">Active</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-9">
                    
                    <Section id="overview" title="1. System Overview">
                        <p>
                            The Agentic Election Simulator (AES) uses <strong>Agent-Based Modeling (ABM)</strong> to simulate emergent voter turnout. Unlike regression models that rely on aggregate correlations, AES simulates <MathExpr>{'N'}</MathExpr> distinct cognitive agents.
                        </p>
                        <p>
                            The simulation executes in three phases:
                        </p>
                        <ol className="list-decimal list-inside space-y-4 pl-2 marker:text-sky-500 marker:font-bold mt-4 bg-slate-900/30 p-6 rounded-lg border border-slate-800/50">
                            <li><strong>Population Synthesis:</strong> Agents are instantiated with vectors of demographic and psychometric traits using skewed probability distributions (e.g., Beta distribution approximations).</li>
                            <li><strong>Cognitive Processing:</strong> Each agent processes environmental signals (Costs, Social Norms) through a specific Behavioral Kernel.</li>
                            <li><strong>Decision Execution:</strong> Agents output a binary decision <MathExpr>{'d \\in \\{0, 1\\}'}</MathExpr> and a confidence probability <MathExpr>{'p'}</MathExpr>.</li>
                        </ol>
                    </Section>

                    <Section id="agent-architecture" title="2. Agent Architecture">
                        <p>
                            Agents are not static data points but dynamic objects with state. Their behavior is governed by a set of normalized parameters.
                        </p>

                        <SubHeader>2.1 Psychometric Parameters</SubHeader>
                        <Table 
                            headers={["Parameter", "Range", "Description"]}
                            rows={[
                                ["Civic Duty (D)", "0.0 - 1.0", "Intrinsic satisfaction from the act of voting, independent of outcome."],
                                ["Habit Strength (H)", "0.0 - 1.0", "Behavioral inertia. Modeled as frequency of voting in past 5 elections."],
                                ["Social Sensitivity (S)", "0.0 - 1.0", "Susceptibility to peer pressure and desire for conformity."],
                                ["Risk Aversion (R)", "0.0 - 1.0", "Tolerance for uncertainty. High aversion amplifies perceived costs."],
                                ["Overconfidence (O)", "0.0 - 1.5", <span>Cognitive bias multiplier applied to the perceived probability of pivotality (<MathExpr>{'P'}</MathExpr>).</span>],
                            ]} 
                        />
                    </Section>

                    <Section id="models" title="3. Behavioral Models">
                        <p>The core engine supports three distinct cognitive architectures.</p>

                        <SubHeader>3.1 Extended Utility Model</SubHeader>
                        <p>
                            An evolution of the Riker-Ordeshook calculus. An agent votes if Total Utility <MathExpr>{'U > 0'}</MathExpr>.
                        </p>
                        <Callout title="The Equation" type="info">
                            <MathExpr block>{'U_i = \\beta_{pB}(P \\cdot B_i) - \\beta_C(C_i) + \\beta_D(D_i) + \\beta_S(S_i) + \\beta_H(H_i) + \\epsilon'}</MathExpr>
                        </Callout>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-6">
                            <li className="bg-slate-900/40 p-3 rounded border border-slate-800"><strong className="text-sky-300">P · B</strong>: Instrumental Benefit (Pivotality × Stakes).</li>
                            <li className="bg-slate-900/40 p-3 rounded border border-slate-800"><strong className="text-rose-400">C</strong>: Cost (Time, effort, friction).</li>
                            <li className="bg-slate-900/40 p-3 rounded border border-slate-800"><strong className="text-emerald-400">D, S, H</strong>: Intrinsic & Social rewards.</li>
                            <li className="bg-slate-900/40 p-3 rounded border border-slate-800"><strong className="text-slate-400">ε</strong>: Stochastic noise (Logistic distribution).</li>
                        </ul>

                        <SubHeader>3.2 Drift-Diffusion Model (DDM)</SubHeader>
                        <p>
                            Models decision-making as a stochastic process of evidence accumulation over time, capturing the speed-accuracy trade-off.
                        </p>
                        <DiagramDriftDiffusion />
                        <Callout title="Stochastic Differential Equation" type="info">
                            <MathExpr block>{'dX(t) = \\mu \\cdot dt + \\sigma \\cdot dW(t)'}</MathExpr>
                        </Callout>
                        <p className="mt-4 text-sm text-slate-400">
                            The agent accumulates evidence until it hits threshold <MathExpr>{'a'}</MathExpr> (Vote) or <MathExpr>{'0'}</MathExpr> (Abstain). The drift rate <MathExpr>{'\\mu'}</MathExpr> is determined by the weighted sum of incentives.
                        </p>

                        <SubHeader>3.3 Dual-System Model</SubHeader>
                        <p>
                            Based on Kahneman's Type 1 (Fast) and Type 2 (Slow) thinking. It resolves the voting paradox by allowing habit to bypass cost analysis.
                        </p>
                        <DiagramDualSystem />
                        <Callout title="Arbitration Logic" type="info">
                            <MathExpr block>{'P(Vote) = \\lambda \\cdot P_{S1} + (1 - \\lambda) \\cdot P_{S2}'}</MathExpr>
                        </Callout>
                        <p className="mt-4 text-sm">
                            The parameter <MathExpr>{'\\lambda'}</MathExpr> (Lambda) represents <strong>Cognitive Control</strong>.
                            <br/>
                            <span className="pl-4 block mt-2 text-slate-500 italic border-l-2 border-slate-700 ml-2"><MathExpr>{'If Education is High: \\lambda \\to 0 (More System 2/Rationality).'}</MathExpr></span >
                        </p>
                    </Section>

                    <Section id="nudges" title="4. Nudge Mechanics">
                        <p>Interventions are modeled as vector operations on specific parameters.</p>
                        
                        <Table 
                            headers={["Nudge", "Mechanism", "Impact"]}
                            rows={[
                                ["Monetary Lottery", "Extrinsic Incentive", <span>Adds constant <MathExpr>{'V'}</MathExpr> to Utility or Drift Rate.</span>],
                                ["Social Norm", "Conformity", <span>Increases <MathExpr>{'S'}</MathExpr> proportional to the gap between <i>Revealed Turnout</i> and expectation.</span>],
                                ["Identity Frame", "Self-Concept", <span>Boosts <MathExpr>{'D'}</MathExpr> (Duty) and System 1 Affect.</span>],
                                ["Implementation Intention", "Friction Reduction", <span>Reduces effective Cost: <MathExpr>{'C_{new} = C \\cdot (1 - r)'}</MathExpr>.</span>],
                            ]} 
                        />
                    </Section>

                     <Section id="tuning" title="5. Calibration Engine">
                        <p>
                            The Model Tuner employs a <strong>Multi-Start Global Optimization</strong> strategy. To prevent getting trapped in local minima—common in high-dimensional behavioral loss landscapes—the engine performs multiple parallel tuning runs.
                        </p>

                        <SubHeader>5.1 Multi-Start Simulated Annealing</SubHeader>
                         <ul className="list-disc list-inside space-y-4 pl-2 mt-4 text-slate-400">
                            <li>
                                <strong>Run 1 (Baseline Refinement):</strong> Starts optimization from the conservative template defaults. This ensures the solution is at least as good as the standard model.
                            </li>
                            <li>
                                <strong>Run 2 & 3 (Global Search):</strong> Initiates optimization from <em>stochastically generated</em> configurations. This forces the annealer to explore distant regions of the parameter space.
                            </li>
                            <li>
                                <strong>Selection:</strong> The engine compares the final energy state (RMSE) of all runs and selects the global best solution for analysis.
                            </li>
                        </ul>

                        <SubHeader>5.2 The Objective Function</SubHeader>
                        <Callout title="Root Mean Square Error" type="info">
                             <MathExpr block>{'RMSE = \\sqrt{ \\sum(Predicted_i - Actual_i)^2 / k }'}</MathExpr>
                        </Callout>
                        
                        <SubHeader>5.3 Robust Metric Calculation</SubHeader>
                        <p>
                            To ensure mathematical correctness, the "Improvement" metric is calculated by establishing a <strong>High-Fidelity Baseline</strong>.
                        </p>
                         <ul className="list-disc list-inside space-y-2 pl-2 mt-4 text-slate-400">
                            <li><MathExpr>{'Step 1: Run simulation with initial params at N=2500 to get E_{base}.'}</MathExpr></li>
                            <li><MathExpr>{'Step 2: Run annealing loop at N=800 (Low-Fi) for speed.'}</MathExpr></li>
                            <li><MathExpr>{'Step 3: Validate final params at N=2500 to get E_{final}.'}</MathExpr></li>
                            <li><MathExpr>{'Step 4: Report Improvement \\Delta = E_{base} - E_{final}.'}</MathExpr></li>
                        </ul>
                    </Section>
                </main>
            </div>
        </div>
    );
};

export default DocumentationPage;
