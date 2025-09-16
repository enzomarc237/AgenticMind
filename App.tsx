import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { PatternSelector } from './components/PatternSelector';
import { PromptInput } from './components/PromptInput';
import { InteractionView } from './components/InteractionView';
import { SettingsModal } from './components/SettingsModal';
import { AgenticPattern, LogEntry } from './types';
import { runAgenticPattern } from './services/geminiService';
import { GlobalSettings, AllPatternSettings, DEFAULT_GLOBAL_SETTINGS, DEFAULT_PATTERN_SETTINGS } from './settings';

interface PatternState {
  logEntries: LogEntry[];
  prompt: string;
}

const initialPatternState: () => PatternState = () => ({
  logEntries: [],
  prompt: '',
});

const initialStates = Object.values(AgenticPattern).reduce((acc, pattern) => {
  acc[pattern] = initialPatternState();
  return acc;
}, {} as Record<AgenticPattern, PatternState>);


const App: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<AgenticPattern>(AgenticPattern.Reflection);
  const [patternStates, setPatternStates] = useState<Record<AgenticPattern, PatternState>>(initialStates);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<AgenticPattern | 'global'>('global');
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [patternSettings, setPatternSettings] = useState<AllPatternSettings>(DEFAULT_PATTERN_SETTINGS);

  const currentPatternState = patternStates[selectedPattern];
  
  useEffect(() => {
      // Theme handler
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(globalSettings.theme);
  }, [globalSettings.theme]);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyError(true);
      const errorEntry: LogEntry = {
        id: 'api-key-error',
        type: 'error',
        content: 'CRITICAL: Gemini API Key is not configured. Please set the API_KEY environment variable.'
      };
      const errorStates = Object.keys(patternStates).reduce((acc, pattern) => {
          acc[pattern as AgenticPattern] = { ...initialPatternState(), logEntries: [errorEntry] };
          return acc;
      }, {} as Record<AgenticPattern, PatternState>);
      setPatternStates(errorStates);
    }
  }, []);

  const handleOpenSettings = (tab: AgenticPattern | 'global' = 'global') => {
      setSettingsInitialTab(tab);
      setIsSettingsOpen(true);
  }

  const handlePatternSelect = (pattern: AgenticPattern) => {
    if (!isLoading) {
      setSelectedPattern(pattern);
    }
  };
  
  const handlePromptChange = (newPrompt: string) => {
    setPatternStates(prev => ({
        ...prev,
        [selectedPattern]: {
            ...prev[selectedPattern],
            prompt: newPrompt,
        }
    }));
  };

  const streamCallback = useCallback((entry: LogEntry) => {
    setPatternStates(prev => {
        const currentEntries = prev[selectedPattern].logEntries;
        let newEntries;
        if (entry.type === 'ai' && currentEntries.length > 0 && currentEntries[currentEntries.length - 1]?.type === 'ai') {
            newEntries = [...currentEntries];
            newEntries[newEntries.length - 1] = entry;
        } else {
             newEntries = [...currentEntries, entry];
        }
        
        return {
            ...prev,
            [selectedPattern]: {
                ...prev[selectedPattern],
                logEntries: newEntries
            }
        };
    });
}, [selectedPattern]);

  const handleSubmit = async () => {
    const prompt = currentPatternState.prompt;
    if (!prompt.trim() || isLoading || apiKeyError) return;

    setIsLoading(true);
    const userEntry: LogEntry = { id: Date.now().toString(), type: 'user', content: prompt };
    
    setPatternStates(prev => ({
        ...prev,
        [selectedPattern]: {
            ...prev[selectedPattern],
            logEntries: [userEntry]
        }
    }));

    try {
      await runAgenticPattern(selectedPattern, prompt, streamCallback, globalSettings, patternSettings);
    } catch (error) {
      console.error(error);
      const errorEntry: LogEntry = { 
        id: Date.now().toString() + '-error', 
        type: 'error', 
        content: error instanceof Error ? error.message : 'An unexpected error occurred.'
      };
      streamCallback(errorEntry);
    } finally {
      setIsLoading(false);
      handlePromptChange('');
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
      <Header onOpenSettings={() => handleOpenSettings('global')} />
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0">
          <PatternSelector 
            selectedPattern={selectedPattern} 
            onSelectPattern={handlePatternSelect}
            isLoading={isLoading}
            onConfigurePattern={(pattern) => handleOpenSettings(pattern)}
          />
        </div>
        <InteractionView logEntries={currentPatternState.logEntries} isLoading={isLoading} selectedPattern={selectedPattern} />
        <div className="flex-shrink-0">
          <PromptInput
            prompt={currentPatternState.prompt}
            onPromptChange={handlePromptChange}
            onSubmit={handleSubmit}
            isLoading={isLoading || apiKeyError}
            selectedPattern={selectedPattern}
          />
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        globalSettings={globalSettings}
        onGlobalSettingsChange={setGlobalSettings}
        patternSettings={patternSettings}
        onPatternSettingsChange={setPatternSettings}
        initialTab={settingsInitialTab}
      />
    </div>
  );
};

export default App;
