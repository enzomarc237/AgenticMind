
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { PatternSelector } from './components/PatternSelector';
import { PromptInput } from './components/PromptInput';
import { InteractionView } from './components/InteractionView';
import { AgenticPattern, LogEntry } from './types';
import { runAgenticPattern } from './services/geminiService';

const App: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<AgenticPattern>(AgenticPattern.Reflection);
  const [prompt, setPrompt] = useState<string>('');
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  const [maxIterations, setMaxIterations] = useState<number>(3);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyError(true);
      setLogEntries([{
        id: 'api-key-error',
        type: 'error',
        content: 'CRITICAL: Gemini API Key is not configured. Please set the API_KEY environment variable.'
      }]);
    }
  }, []);

  const handlePatternSelect = (pattern: AgenticPattern) => {
    if (!isLoading) {
      setSelectedPattern(pattern);
      setLogEntries([]);
      setPrompt('');
    }
  };

  const streamCallback = useCallback((entry: LogEntry) => {
    setLogEntries(prevEntries => {
      // For streaming content, update the last entry if it's the same type
      if (entry.type === 'ai' && prevEntries[prevEntries.length - 1]?.type === 'ai') {
        const newEntries = [...prevEntries];
        newEntries[newEntries.length - 1] = entry;
        return newEntries;
      }
      return [...prevEntries, entry];
    });
  }, []);

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading || apiKeyError) return;

    setIsLoading(true);
    const userEntry: LogEntry = { id: Date.now().toString(), type: 'user', content: prompt };
    setLogEntries([userEntry]);

    try {
      await runAgenticPattern(selectedPattern, prompt, streamCallback, maxIterations);
    } catch (error) {
      console.error(error);
      const errorEntry: LogEntry = { 
        id: Date.now().toString() + '-error', 
        type: 'error', 
        content: error instanceof Error ? error.message : 'An unexpected error occurred.'
      };
      setLogEntries(prev => [...prev, errorEntry]);
    } finally {
      setIsLoading(false);
      setPrompt('');
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
        <InteractionView logEntries={logEntries} isLoading={isLoading} />
        <div className="flex-shrink-0">
          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
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
