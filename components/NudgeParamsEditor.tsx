import React from 'react';
import { NudgeType, EditableNudgeParams } from '../types';

interface NudgeParamsEditorProps {
  nudgeType: NudgeType;
  params: EditableNudgeParams;
  setParams: React.Dispatch<React.SetStateAction<EditableNudgeParams>>;
}

const NudgeParamsEditor: React.FC<NudgeParamsEditorProps> = ({ nudgeType, params, setParams }) => {
  if (nudgeType === NudgeType.None) return null;

  const handleParamChange = (nudge: NudgeType, key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setParams(prev => ({
        ...prev,
        [nudge]: {
          ...prev[nudge],
          [key]: numValue,
        },
      }));
    }
  };

  const ParamInput: React.FC<{label: string, id: string, value: number, step: number, min?: number, max?: number}> = ({label, id, value, step, min, max}) => (
    <div>
        <label htmlFor={id} className="block text-xs font-medium text-slate-400">{label}</label>
        <input
            type="number"
            id={id}
            value={value}
            step={step}
            min={min}
            max={max}
            onChange={(e) => handleParamChange(nudgeType, id, e.target.value)}
            className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-md shadow-sm py-1 px-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
    </div>
  );

  const renderInputs = () => {
    switch (nudgeType) {
      case NudgeType.Monetary:
        const monetaryParams = params[NudgeType.Monetary];
        return (
          <div className="grid grid-cols-2 gap-4">
            <ParamInput label="Lottery Prob." id="lottery_probability" value={monetaryParams.lottery_probability} step={0.01} min={0} max={1}/>
            <ParamInput label="Lottery Value" id="lottery_value" value={monetaryParams.lottery_value} step={1.0} min={0} />
          </div>
        );
      case NudgeType.SocialNorm:
        const socialParams = params[NudgeType.SocialNorm];
        return (
            <ParamInput label="Revealed Turnout" id="revealed_turnout" value={socialParams.revealed_turnout} step={0.01} min={0} max={1}/>
        );
      case NudgeType.Competitiveness:
        const compParams = params[NudgeType.Competitiveness];
        return (
            <ParamInput label="Info Boost" id="info_boost" value={compParams.info_boost} step={0.1} min={0} max={2}/>
        );
      case NudgeType.Implementation:
        const implParams = params[NudgeType.Implementation];
        return (
            <div className="grid grid-cols-2 gap-4">
                <ParamInput label="Cost Reduction" id="cost_reduction" value={implParams.cost_reduction} step={0.01} min={0} max={1}/>
                <ParamInput label="Habit Boost" id="habit_boost" value={implParams.habit_boost} step={0.01} min={0} max={1} />
            </div>
        );
       case NudgeType.IdentityFrame:
         const identityParams = params[NudgeType.IdentityFrame];
         return (
             <ParamInput label="Strength" id="strength" value={identityParams.strength} step={0.1} min={0} max={2} />
         );
      default:
        return <p className="text-xs text-slate-500">This nudge has no editable parameters.</p>;
    }
  };

  return (
    <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700">
        <p className="text-sm font-semibold text-slate-300 mb-3">{nudgeType} Parameters</p>
        {renderInputs()}
    </div>
  );
};

export default NudgeParamsEditor;
