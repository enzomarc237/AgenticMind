
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { PatternSelector } from './components/PatternSelector';
import { PromptInput } from './components/PromptInput';
import { InteractionView } from './components/InteractionView';
import { AgenticPattern, LogEntry } from './types';
import { runAgenticPattern } from './services/geminiService';

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
  const [maxIterations, setMaxIterations] = useState<number>(3);
  
  const currentPatternState = patternStates[selectedPattern];

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyError(true);
      const errorEntry: LogEntry = {
        id: 'api-key-error',
        type: 'error',
        content: 'CRITICAL: Gemini API Key is not configured. Please set the API_KEY environment variable.'
      };
      // Set error message for all patterns
      const errorStates = Object.keys(patternStates).reduce((acc, pattern) => {
          acc[pattern as AgenticPattern] = { ...initialPatternState(), logEntries: [errorEntry] };
          return acc;
      }, {} as Record<AgenticPattern, PatternState>);
      setPatternStates(errorStates);
    }
  }, []);

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
        // For streaming content, update the last entry if it's the same type.
        // This creates the effect of the text being "streamed" into one message box.
        if (entry.type === 'ai' && currentEntries.length > 0 && currentEntries[currentEntries.length - 1]?.type === 'ai') {
            newEntries = [...currentEntries];
            newEntries[newEntries.length - 1] = entry; // Replace the last entry with the new one
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
    
    // Replace current log with just the new user prompt to start a new session
    setPatternStates(prev => ({
        ...prev,
        [selectedPattern]: {
            ...prev[selectedPattern],
            logEntries: [userEntry]
        }
    }));

    try {
      await runAgenticPattern(selectedPattern, prompt, streamCallback, maxIterations);
    } catch (error) {
      console.error(error);
      const errorEntry: LogEntry = { 
        id: Date.now().toString() + '-error', 
        type: 'error', 
        content: error instanceof Error ? error.message : 'An unexpected error occurred.'
      };
      // Use callback to add error to the log
      streamCallback(errorEntry);
    } finally {
      setIsLoading(false);
      // Clear prompt for the current pattern after submission
      handlePromptChange('');
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0">
          <PatternSelector 
            selectedPattern={selectedPattern} 
            onSelectPattern={handlePatternSelect}
            isLoading={isLoading}
            maxIterations={maxIterations}
            onMaxIterationsChange={setMaxIterations}
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
    </div>
  );
};

export default App;
