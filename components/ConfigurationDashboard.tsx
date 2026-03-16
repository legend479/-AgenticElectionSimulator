
import React, { useState, useEffect } from 'react';
import { FullSimulationConfig, ModelType } from '../types';
import { SCENARIO_TEMPLATES } from '../constants';
import Modal from './ui/Modal';
import Accordion from './ui/Accordion';
import Tooltip from './ui/Tooltip';
import { Save, Upload, Copy, Trash2, Globe, Users, Zap, Database, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../services/utils';

interface ConfigurationDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  config: FullSimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<FullSimulationConfig>>;
  savedProfiles: FullSimulationConfig[];
  setSavedProfiles: React.Dispatch<React.SetStateAction<FullSimulationConfig[]>>;
}

const ConfigurationDashboard: React.FC<ConfigurationDashboardProps> = ({ isOpen, onClose, config, setConfig, savedProfiles, setSavedProfiles }) => {
  const [newProfileName, setNewProfileName] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    if (isOpen) {
        setJsonText(JSON.stringify(config, null, 2));
        if (config.profileName.endsWith(' (Customized)')) {
            if (!savedProfiles.some(p => p.profileName === config.profileName)) {
                setNewProfileName(config.profileName);
            } else {
                setNewProfileName('');
            }
        } else {
            setNewProfileName('');
        }
        setStatus(null);
    }
  }, [isOpen, config, savedProfiles]);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleSaveProfile = () => {
    const trimmedName = newProfileName.trim();
    if (!trimmedName) {
      showStatus('error', "Profile name cannot be empty.");
      return;
    }
    if (savedProfiles.some(p => p.profileName === trimmedName)) {
      showStatus('error', "A profile with this name already exists.");
      return;
    }
    const newProfile = {
      ...config,
      profileName: trimmedName,
    };
    setSavedProfiles(prev => [...prev, newProfile]);
    setNewProfileName('');
    showStatus('success', `Profile "${trimmedName}" saved!`);
  };

  const handleDeleteProfile = (profileNameToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete profile "${profileNameToDelete}"?`)) {
        setSavedProfiles(prev => prev.filter(p => p.profileName !== profileNameToDelete));
        showStatus('success', "Profile deleted.");
    }
  };

  const handleLoadProfile = (profile: FullSimulationConfig) => {
    setConfig(profile);
    showStatus('success', `Loaded "${profile.profileName}"`);
  };

  const handleApplyJson = () => {
      try {
          const parsed = JSON.parse(jsonText);
          if (!parsed.globalContext || !parsed.agentGeneration || !parsed.modelPhysics) {
              throw new Error("Invalid configuration format.");
          }
          setConfig(parsed);
          showStatus('success', "Configuration applied!");
      } catch (e) {
          showStatus('error', `Error: ${(e as Error).message}`);
      }
  };

  const handleCopyJson = () => {
      navigator.clipboard.writeText(jsonText);
      showStatus('success', "Copied to clipboard!");
  };

  const createHandler = (path: string) => (field: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const keys = path.split('.');
      setConfig(prev => {
        const newConfig = JSON.parse(JSON.stringify(prev));
        let current = newConfig;
        for(let i = 0; i < keys.length; i++) {
          if (i === keys.length - 1) {
            current[keys[i]][field] = numValue;
          } else {
            current = current[keys[i]];
          }
        }
        if (!newConfig.profileName.endsWith(' (Customized)')) {
            newConfig.profileName = `${newConfig.profileName} (Customized)`;
        }
        return newConfig;
      });
    }
  };

  const globalHandler = createHandler('globalContext');
  const agentHandler = createHandler('agentGeneration');
  const utilityHandler = createHandler('modelPhysics.utility');
  const ddmHandler = createHandler('modelPhysics.ddm');
  const dsHandler = createHandler('modelPhysics.dual_system');

  const ParamSlider: React.FC<{
      label: string, 
      value: number, 
      min: number, 
      max: number, 
      step: number, 
      handler: (field: string, value: string) => void, 
      field: string,
      tooltip: string
  }> = ({label, value, min, max, step, handler, field, tooltip}) => (
    <div className="flex flex-col space-y-3 py-4 border-b border-slate-800/30 last:border-0 group">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{label}</span>
            <Tooltip text={tooltip} />
          </div>
          <span className="text-[10px] font-black font-mono text-sky-400 bg-sky-500/5 px-2 py-0.5 rounded border border-sky-500/10">
            {value.toFixed(3)}
          </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-grow h-1.5">
          <div className="absolute inset-0 bg-slate-800/50 rounded-full" />
          <input type="range" min={min} max={max} step={step} value={value}
            onChange={(e) => handler(field, e.target.value)}
            className="absolute inset-0 w-full h-1.5 bg-transparent appearance-none cursor-pointer accent-sky-500 z-10"
          />
        </div>
        <input type="number" value={value} step={step}
          onChange={(e) => handler(field, e.target.value)}
          className="bg-slate-900/80 border border-slate-800 rounded-lg py-1 px-2 text-slate-300 text-[10px] font-bold w-16 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all"
        />
      </div>
    </div>
  );
  
  const isTemplate = (profileName: string) => Object.values(SCENARIO_TEMPLATES).some(t => t.profileName === profileName);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advanced Configuration Dashboard">
      <div className="relative space-y-8 pb-4">
        {/* Status Toast */}
        {status && (
          <div className={cn(
            "fixed top-24 right-8 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl animate-slide-up border backdrop-blur-2xl",
            status.type === 'success' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          )}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-xs font-black uppercase tracking-widest">{status.message}</span>
          </div>
        )}

        <Accordion title="Profile Management" icon={<Save className="w-4 h-4 text-emerald-400" />} defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-2">
                <div className="space-y-5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Download className="w-3 h-3" /> Save Current Snapshot
                    </h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter profile name..."
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            className="flex-grow bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-slate-700"
                        />
                        <button 
                          onClick={handleSaveProfile} 
                          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl text-[10px] transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                    </div>
                </div>
                 <div className="space-y-5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Upload className="w-3 h-3" /> Load Stored Profile
                    </h4>
                    <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                        {savedProfiles.map(profile => (
                            <div key={profile.profileName} className="group flex items-center justify-between p-3.5 bg-slate-900/30 hover:bg-slate-800/30 rounded-xl border border-slate-800/50 transition-all">
                                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors truncate max-w-[180px]">{profile.profileName}</span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => handleLoadProfile(profile)} 
                                      className="px-4 py-1.5 bg-slate-700 hover:bg-sky-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                      Load
                                    </button>
                                    {!isTemplate(profile.profileName) && (
                                        <button 
                                          onClick={() => handleDeleteProfile(profile.profileName)} 
                                          className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Accordion>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Accordion title="Global Context" icon={<Globe className="w-4 h-4 text-sky-400" />}>
              <div className="space-y-1">
                  <ParamSlider 
                      label="Electoral Competitiveness" 
                      field="electoral_competitiveness" 
                      value={config.globalContext.electoral_competitiveness} 
                      min={0} max={1} step={0.01} 
                      handler={globalHandler} 
                      tooltip="Probability that a single vote will be decisive. High values (near 1) indicate a dead heat."
                  />
                  <ParamSlider 
                      label="Voting Cost (Total)" 
                      field="voting_cost_total" 
                      value={config.globalContext.voting_cost_total} 
                      min={0} max={1} step={0.01} 
                      handler={globalHandler} 
                      tooltip="The aggregate barrier to voting (time, effort, logistical friction). Higher values reduce turnout."
                  />
              </div>
          </Accordion>

          <Accordion title="Agent Generation" icon={<Users className="w-4 h-4 text-purple-400" />}>
              <div className="space-y-1">
                  <ParamSlider 
                      label="Education Skew" 
                      field="education_skew" 
                      value={config.agentGeneration.education_skew} 
                      min={0.1} max={5} step={0.1} 
                      handler={agentHandler} 
                      tooltip="Controls population education distribution. >1 skews towards high education, <1 skews towards low."
                  />
                  <ParamSlider 
                      label="Urban Probability" 
                      field="urban_prob" 
                      value={config.agentGeneration.urban_prob} 
                      min={0} max={1} step={0.01} 
                      handler={agentHandler} 
                      tooltip="Probability that an agent lives in an urban environment."
                  />
                  <ParamSlider 
                      label="Civic Duty Skew" 
                      field="civic_duty_skew" 
                      value={config.agentGeneration.civic_duty_skew} 
                      min={0.1} max={5} step={0.1} 
                      handler={agentHandler} 
                      tooltip="Controls distribution of intrinsic civic duty. >1 means most agents feel a strong duty to vote."
                  />
                  <ParamSlider 
                      label="Past Vote Probability" 
                      field="past_vote_prob" 
                      value={config.agentGeneration.past_vote_prob} 
                      min={0} max={1} step={0.01} 
                      handler={agentHandler} 
                      tooltip="Probability that agents voted in previous elections, determining their baseline Habit Strength."
                  />
              </div>
          </Accordion>
        </div>

        <Accordion title="Model Physics Calibration" icon={<Zap className="w-4 h-4 text-orange-400" />}>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="space-y-4">
               <h3 className="text-xs font-black text-sky-500 uppercase tracking-widest border-b border-sky-500/20 pb-2">Utility Model</h3>
               <div className="space-y-1">
                 <ParamSlider label="β (pB)" field="beta_pB" value={config.modelPhysics.utility.beta_pB} min={0} max={3} step={0.1} handler={utilityHandler} tooltip="Weight assigned to the Instrumental Benefit (Pivotality × Stakes)." />
                 <ParamSlider label="β (Cost)" field="beta_C" value={config.modelPhysics.utility.beta_C} min={-3} max={0} step={0.1} handler={utilityHandler} tooltip="Negative weight assigned to the Cost of voting." />
                 <ParamSlider label="β (Duty)" field="beta_D" value={config.modelPhysics.utility.beta_D} min={0} max={3} step={0.1} handler={utilityHandler} tooltip="Weight assigned to Civic Duty." />
                 <ParamSlider label="β (Habit)" field="beta_H" value={config.modelPhysics.utility.beta_H} min={0} max={3} step={0.1} handler={utilityHandler} tooltip="Weight assigned to Habit." />
                 <ParamSlider label="β (Social)" field="beta_S" value={config.modelPhysics.utility.beta_S} min={0} max={3} step={0.1} handler={utilityHandler} tooltip="Weight assigned to Social Pressure." />
                 <ParamSlider label="Decision Noise" field="decision_noise" value={config.modelPhysics.utility.decision_noise} min={0.1} max={5} step={0.1} handler={utilityHandler} tooltip="Randomness in the final decision." />
               </div>
             </div>
             
             <div className="space-y-4">
               <h3 className="text-xs font-black text-purple-500 uppercase tracking-widest border-b border-purple-500/20 pb-2">Drift-Diffusion</h3>
               <div className="space-y-1">
                 <ParamSlider label="Base Drift (μ)" field="base_mu" value={config.modelPhysics.ddm.base_mu} min={-0.5} max={0.5} step={0.01} handler={ddmHandler} tooltip="Baseline drift rate." />
                 <ParamSlider label="Threshold (a)" field="threshold_a" value={config.modelPhysics.ddm.threshold_a} min={0.5} max={5} step={0.1} handler={ddmHandler} tooltip="Evidence required for decision." />
                 <ParamSlider label="Noise (σ)" field="noise" value={config.modelPhysics.ddm.noise} min={0.1} max={5} step={0.1} handler={ddmHandler} tooltip="Randomness in accumulation." />
                 <ParamSlider label="β (Duty)" field="beta_D" value={config.modelPhysics.ddm.beta_D} min={0} max={1} step={0.01} handler={ddmHandler} tooltip="Impact of Civic Duty." />
                 <ParamSlider label="β (Habit)" field="beta_H" value={config.modelPhysics.ddm.beta_H} min={0} max={1} step={0.01} handler={ddmHandler} tooltip="Impact of Habit." />
                 <ParamSlider label="β (Social)" field="beta_S" value={config.modelPhysics.ddm.beta_S} min={0} max={1} step={0.01} handler={ddmHandler} tooltip="Impact of Social Pressure." />
               </div>
             </div>
             
             <div className="space-y-4">
               <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-500/20 pb-2">Dual-System</h3>
               <div className="space-y-1">
                 <ParamSlider label="S1 Habit" field="h_habit" value={config.modelPhysics.dual_system.h_habit} min={0} max={3} step={0.1} handler={dsHandler} tooltip="Weight of Habit in System 1." />
                 <ParamSlider label="S1 Social" field="h_social" value={config.modelPhysics.dual_system.h_social} min={0} max={3} step={0.1} handler={dsHandler} tooltip="Weight of Social norms in System 1." />
                 <ParamSlider label="S2 Duty" field="u_duty" value={config.modelPhysics.dual_system.u_duty} min={0} max={3} step={0.1} handler={dsHandler} tooltip="Utility weight of Civic Duty." />
                 <ParamSlider label="S2 Benefit" field="u_pB" value={config.modelPhysics.dual_system.u_pB} min={0} max={3} step={0.1} handler={dsHandler} tooltip="Utility weight of Instrumental Benefit." />
                 <ParamSlider label="λ Base" field="lambda_base" value={config.modelPhysics.dual_system.lambda_base} min={0} max={1} step={0.01} handler={dsHandler} tooltip="Baseline weight for System 1." />
                 <ParamSlider label="λ Edu Factor" field="lambda_edu_factor" value={config.modelPhysics.dual_system.lambda_edu_factor} min={-1} max={1} step={0.01} handler={dsHandler} tooltip="Education's effect on S1 usage." />
               </div>
             </div>
           </div>
        </Accordion>

        <Accordion title="Data Import / Export" icon={<Database className="w-4 h-4 text-slate-400" />}>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-medium">
                      Directly manipulate the simulation state via JSON.
                  </p>
                  <div className="flex gap-2">
                      <button
                          onClick={handleCopyJson}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-all flex items-center gap-2 border border-slate-700"
                      >
                          <Copy className="w-3 h-3" /> Copy
                      </button>
                      <button
                          onClick={handleApplyJson}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-sky-900/20"
                      >
                          <Zap className="w-3 h-3" /> Apply
                      </button>
                  </div>
                </div>
                <textarea
                    className="w-full h-64 bg-slate-950 font-mono text-[10px] text-slate-400 border border-slate-800 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all custom-scrollbar"
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                />
            </div>
        </Accordion>
      </div>
    </Modal>
  );
};

export default ConfigurationDashboard;
