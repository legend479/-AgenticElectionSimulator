
import React from 'react';
import { ModelType, NudgeType, SimulationSettings, EditableNudgeParams, FullSimulationConfig } from '../types';
import Card from './ui/Card';
import Tooltip from './ui/Tooltip';
import NudgeParamsEditor from './NudgeParamsEditor';
import { MODEL_DESCRIPTIONS, NUDGE_DESCRIPTIONS } from '../constants';
import { cn, formatNumber } from '../services/utils';
import { Settings, Users, Zap, Play, Edit3, Info } from 'lucide-react';

interface ControlPanelProps {
  settings: Omit<SimulationSettings, 'nudgeParams'>;
  setSettings: React.Dispatch<React.SetStateAction<Omit<SimulationSettings, 'nudgeParams'>>>;
  onRunSimulation: () => void;
  isLoading: boolean;
  nudgeParams: EditableNudgeParams;
  setNudgeParams: React.Dispatch<React.SetStateAction<EditableNudgeParams>>;
  onOpenConfig: () => void;
  currentProfileName: string;
  savedProfiles: FullSimulationConfig[];
  onProfileChange: (profileName: string) => void;
  config: FullSimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<FullSimulationConfig>>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  settings, 
  setSettings, 
  onRunSimulation, 
  isLoading, 
  nudgeParams, 
  setNudgeParams, 
  onOpenConfig, 
  currentProfileName, 
  savedProfiles, 
  onProfileChange,
  config,
  setConfig
}) => {
  const handleSettingChange = <K extends keyof Omit<SimulationSettings, 'nudgeParams'>>(key: K, value: Omit<SimulationSettings, 'nudgeParams'>[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setConfig(prev => {
        const newConfig = {
            ...prev,
            globalContext: {
                ...prev.globalContext,
                campaign_duration: newValue
            }
        };
        if (!newConfig.profileName.endsWith(' (Customized)')) {
            newConfig.profileName = `${newConfig.profileName} (Customized)`;
        }
        return newConfig;
    });
  };
  
  const Label: React.FC<{htmlFor: string, children: React.ReactNode, tooltip?: string, icon?: React.ReactNode}> = ({ htmlFor, children, tooltip, icon }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-400 mb-1.5">
        <span className="flex items-center gap-2">
            {icon}
            {children}
            {tooltip && <Tooltip text={tooltip} />}
        </span>
    </label>
  );

  const Select: React.FC<{id: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode}> = ({ id, value, onChange, children }) => (
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm py-2.5 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-200 appearance-none cursor-pointer"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
    >
      {children}
    </select>
  );
  
  const Section: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode}> = ({ title, icon, children }) => (
    <div className="space-y-4 group/section">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50 group-hover/section:border-slate-700/50 transition-colors">
            <div className="text-sky-500 group-hover/section:scale-110 transition-transform">{icon}</div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</h3>
        </div>
        <div className="pt-1 space-y-4">
            {children}
        </div>
    </div>
  );

  const profileOptionNames = savedProfiles.map(p => p.profileName);
  if (!profileOptionNames.includes(currentProfileName)) {
    profileOptionNames.unshift(currentProfileName);
  }

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="space-y-8 flex-grow">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Simulation Controls</h2>
            <p className="text-sm text-slate-500 mt-1">Adjust parameters to model behavior.</p>
          </div>
          <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Settings className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        
        <div className="space-y-8">
           <Section title="Scenario Context" icon={<Zap className="w-4 h-4" />}>
                <div>
                    <Label htmlFor="scenario">Active Profile</Label>
                    <div className="flex items-center space-x-2">
                        <div className="flex-grow">
                            <Select
                                id="scenario"
                                value={currentProfileName}
                                onChange={(e) => onProfileChange(e.target.value)}
                            >
                                {profileOptionNames.map(name => <option key={name} value={name}>{name}</option>)}
                            </Select>
                        </div>
                        <button
                          onClick={onOpenConfig}
                          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all duration-200 group"
                          aria-label="Edit simulation profiles"
                        >
                            <Edit3 className="h-4 w-4 group-hover:text-sky-400 transition-colors" />
                        </button>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="campaignDuration">Campaign Duration</Label>
                      <span className="text-xs font-mono text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">{config.globalContext.campaign_duration} Days</span>
                    </div>
                    <input
                        type="range"
                        id="campaignDuration"
                        min="7"
                        max="120"
                        step="1"
                        value={config.globalContext.campaign_duration}
                        onChange={handleDurationChange}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                </div>
           </Section>
            
           <Section title="Model Logic" icon={<Zap className="w-4 h-4" />}>
                 <div>
                    <Label htmlFor="model" tooltip={MODEL_DESCRIPTIONS[settings.model]}>Behavioral Model</Label>
                    <Select
                        id="model"
                        value={settings.model}
                        onChange={(e) => handleSettingChange('model', e.target.value as ModelType)}
                    >
                        {Object.values(ModelType).map(m => <option key={m} value={m}>{m}</option>)}
                    </Select>
                </div>
                <div>
                    <Label htmlFor="nudge" tooltip={NUDGE_DESCRIPTIONS[settings.nudge]}>Nudge Intervention</Label>
                    <Select
                        id="nudge"
                        value={settings.nudge}
                        onChange={(e) => handleSettingChange('nudge', e.target.value as NudgeType)}
                    >
                        {Object.values(NudgeType).map(n => (
                            <option key={n} value={n} title={NUDGE_DESCRIPTIONS[n]}>
                                {n}
                            </option>
                        ))}
                    </Select>
                </div>

                {settings.nudge !== NudgeType.None && (
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 animate-slide-up">
                      <NudgeParamsEditor
                          nudgeType={settings.nudge}
                          params={nudgeParams}
                          setParams={setNudgeParams}
                      />
                    </div>
                )}
           </Section>

           <Section title="Population" icon={<Users className="w-4 h-4" />}>
                <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="numAgents">Agent Count</Label>
                      <span className="text-xs font-mono text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">{formatNumber(settings.numAgents)}</span>
                    </div>
                    <input
                        type="range"
                        id="numAgents"
                        min="1000"
                        max="10000"
                        step="1000"
                        value={settings.numAgents}
                        onChange={(e) => handleSettingChange('numAgents', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                </div>
            </Section>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800/50">
        <button
          onClick={onRunSimulation}
          disabled={isLoading}
          className={cn(
            "w-full group relative flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-black text-white transition-all duration-300 overflow-hidden uppercase tracking-widest text-sm",
            "bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400",
            "disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed",
            "shadow-lg shadow-sky-900/20 hover:shadow-sky-500/40 active:scale-[0.98]",
            "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/10 before:to-white/0 before:-translate-x-full hover:before:animate-shimmer"
          )}
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
              <span>Run Simulation</span>
            </>
          )}
        </button>
      </div>
    </Card>
  );
};

export default ControlPanel;
