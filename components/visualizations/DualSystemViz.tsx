
import React from 'react';
import { DualSystemVizData } from '../../types';

interface DualSystemVizProps {
  data: DualSystemVizData;
}

const DualSystemViz: React.FC<DualSystemVizProps> = ({ data }) => {
  const { p_vote_s1, p_vote_s2, lambda, final_p_vote, s1_components, s2_components } = data;
  
  // Angle of the beam, -20 to 20 degrees
  const angle = (final_p_vote - 0.5) * 40;
  // Position of the fulcrum, representing lambda
  const fulcrumPosition = 15 + lambda * 70; // 15% to 85%

  const ComponentList: React.FC<{components: {name: string, value: number}[]}> = ({ components }) => (
    <ul className="text-xs space-y-1">
      {components.map(({name, value}) => (
        <li key={name} className="flex justify-between">
          <span className="text-slate-400">{name}</span>
          <span className={value >= 0 ? 'text-green-400' : 'text-red-400'}>{value.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-6">
      <div className="relative h-40 flex items-center justify-center">
        {/* Balance Beam */}
        <div className="w-full h-1.5 bg-slate-600 rounded-full" style={{ transform: `rotate(${angle}deg)`, transition: 'transform 0.5s ease-in-out' }}>
            <div className="absolute -top-8 left-[5%] text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/30 flex items-center justify-center mx-auto border border-blue-400/50" style={{ transform: `scale(${0.8 + p_vote_s1 * 0.4})`}} />
            </div>
            <div className="absolute -top-8 right-[5%] text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/30 flex items-center justify-center mx-auto border border-purple-400/50" style={{ transform: `scale(${0.8 + p_vote_s2 * 0.4})`}} />
            </div>
        </div>
        {/* Fulcrum */}
        <div className="absolute top-1/2 h-16 w-4 bg-slate-500 rounded-b-md" style={{ left: `calc(${fulcrumPosition}% - 8px)`, transition: 'left 0.5s ease-in-out' }}>
            <div className="absolute -bottom-6 text-center w-40 -ml-16">
                <p className="text-xs text-slate-400">S1 Weight (λ)</p>
                <p className="font-bold text-slate-200">{lambda.toFixed(2)}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* System 1 Card */}
        <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
          <h4 className="font-bold text-blue-300 mb-1">System 1: Heuristics</h4>
          <p className="text-xs text-blue-200/60 mb-2 uppercase tracking-wider">Pattern Matching</p>
          <p className="text-2xl font-bold text-white mb-2">{(p_vote_s1 * 100).toFixed(1)}% <span className="text-xs font-normal text-slate-400">Impulse</span></p>
          <hr className="border-blue-700/50 my-2"/>
          <ComponentList components={s1_components} />
        </div>
        {/* System 2 Card */}
         <div className="bg-purple-900/20 border border-purple-700 p-4 rounded-lg">
          <h4 className="font-bold text-purple-300 mb-1">System 2: Utility</h4>
           <p className="text-xs text-purple-200/60 mb-2 uppercase tracking-wider">Rational Calculus</p>
          <p className="text-2xl font-bold text-white mb-2">{(p_vote_s2 * 100).toFixed(1)}% <span className="text-xs font-normal text-slate-400">Conclusion</span></p>
          <hr className="border-purple-700/50 my-2"/>
          <ComponentList components={s2_components} />
        </div>
      </div>

       <div className="text-center bg-slate-900/50 p-3 rounded-lg">
            <p className="text-sm text-slate-400">Final Weighted Vote Probability</p>
            <p className="text-2xl font-semibold text-sky-400">
                {(final_p_vote * 100).toFixed(1)}%
            </p>
      </div>

    </div>
  );
};

export default DualSystemViz;
