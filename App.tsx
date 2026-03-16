
import React, { useState, useCallback, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import ResultsDisplay from './components/ResultsDisplay';
import { ModelType, NudgeType, SimulationResult, EditableNudgeParams, FullSimulationConfig, SimulationSettings } from './types';
import { runSimulation } from './services/simulationService';
import { NUDGE_PARAMS, SCENARIO_TEMPLATES } from './constants';
import ConfigurationDashboard from './components/ConfigurationDashboard';
import Header from './components/Header';
import UtilityModelPage from './pages/UtilityModelPage';
import DDMModelPage from './pages/DDMModelPage';
import DualSystemModelPage from './pages/DualSystemModelPage';
import ParametersExplainedPage from './pages/ParametersExplainedPage';
import ModelTuner from './components/ModelTuner';
import DocumentationPage from './pages/DocumentationPage';


const PROFILES_STORAGE_KEY = 'agentic-election-simulator-profiles';

const getInitialProfiles = (): FullSimulationConfig[] => {
  try {
    const saved = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.every(p => typeof p === 'object' && p !== null && 'profileName' in p)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Could not load profiles from localStorage", error);
  }
  return Object.values(SCENARIO_TEMPLATES);
};

type Page = 'simulator' | 'utility-model' | 'ddm-model' | 'dual-system-model' | 'parameters-explained' | 'model-tuner' | 'documentation';

const App: React.FC = () => {
  const [fullConfig, setFullConfig] = useState<FullSimulationConfig>(SCENARIO_TEMPLATES.TVM);
  
  const [settings, setSettings] = useState<Omit<SimulationSettings, 'nudgeParams'>>({
    model: ModelType.DualSystem,
    nudge: NudgeType.None,
    numAgents: 5000,
  });

  const [nudgeParams, setNudgeParams] = useState<EditableNudgeParams>(NUDGE_PARAMS);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [savedProfiles, setSavedProfiles] = useState<FullSimulationConfig[]>(getInitialProfiles);

  const [currentPage, setCurrentPage] = useState<Page>('simulator');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['utility-model', 'ddm-model', 'dual-system-model', 'parameters-explained', 'model-tuner', 'documentation'].includes(hash)) {
        setCurrentPage(hash as Page);
      } else {
        setCurrentPage('simulator');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(savedProfiles));
    } catch (error) {
      console.error("Could not save profiles to localStorage", error);
    }
  }, [savedProfiles]);


  const handleRunSimulation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const simulationSettings: SimulationSettings = { ...settings, nudgeParams };
      const simulationResult = await runSimulation(fullConfig, simulationSettings);
      setResult(simulationResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [fullConfig, settings, nudgeParams]);

  const handleProfileChange = (profileName: string) => {
    const newProfile = savedProfiles.find(p => p.profileName === profileName);
    if (newProfile) {
        setFullConfig(newProfile);
        setResult(null); // Clear previous results as they are now invalid
    }
  };
  
  const renderPage = () => {
    switch (currentPage) {
        case 'utility-model': return <UtilityModelPage />;
        case 'ddm-model': return <DDMModelPage />;
        case 'dual-system-model': return <DualSystemModelPage />;
        case 'parameters-explained': return <ParametersExplainedPage />;
        case 'model-tuner': return <ModelTuner />;
        case 'documentation': return <DocumentationPage />;
        case 'simulator':
        default:
            return (
                <main className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-1">
                        <ControlPanel
                        settings={settings}
                        setSettings={setSettings}
                        onRunSimulation={handleRunSimulation}
                        isLoading={isLoading}
                        nudgeParams={nudgeParams}
                        setNudgeParams={setNudgeParams}
                        onOpenConfig={() => setIsConfigOpen(true)}
                        currentProfileName={fullConfig.profileName}
                        savedProfiles={savedProfiles}
                        onProfileChange={handleProfileChange}
                        config={fullConfig}
                        setConfig={setFullConfig}
                        />
                    </div>
                    <div className="xl:col-span-2">
                        <ResultsDisplay 
                        result={result}
                        isLoading={isLoading}
                        error={error}
                        selectedModel={settings.model}
                        fullConfig={fullConfig}
                        settings={settings}
                        nudgeParams={nudgeParams}
                        />
                    </div>
                </main>
            );
    }
  };


  return (
    <div className="min-h-screen text-slate-200 bg-slate-950">
      <Header />
      <div className="container mx-auto p-4 sm:p-6 pt-24 sm:pt-28">
        
        {renderPage()}
        
        <footer className="text-center mt-12 py-6 text-slate-500 text-xs border-t border-slate-800/50">
            <p>#ToVote OrNot ToVote - Agentic Election Simulator</p>
        </footer>
      </div>

      {isConfigOpen && (
        <ConfigurationDashboard
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          config={fullConfig}
          setConfig={setFullConfig}
          savedProfiles={savedProfiles}
          setSavedProfiles={setSavedProfiles}
        />
      )}
    </div>
  );
};

export default App;
