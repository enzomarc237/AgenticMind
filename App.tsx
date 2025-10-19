import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { PatternSelector } from './components/PatternSelector';
import { PromptInput } from './components/PromptInput';
import { InteractionView } from './components/InteractionView';
import { SettingsModal } from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import PasswordResetModal from './components/PasswordResetModal';
import ConversationSidebar from './components/ConversationSidebar';
import GuestBanner from './components/GuestBanner';
import { AgenticPattern, LogEntry, AgenticPatternType } from './types';
import { runAgenticPattern } from './services/geminiService';
import { GlobalSettings, AllPatternSettings, DEFAULT_GLOBAL_SETTINGS, DEFAULT_PATTERN_SETTINGS } from './settings';
import { useAuth } from './hooks/useAuth';
import { useConversation } from './contexts/ConversationContext';

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

// Map AgenticPattern enum to AgenticPatternType
const mapPatternToType = (pattern: AgenticPattern): AgenticPatternType => {
  switch (pattern) {
    case AgenticPattern.Reflection:
      return 'reflection';
    case AgenticPattern.ToolUse:
      return 'tool_use';
    case AgenticPattern.ReAct:
      return 'react';
    case AgenticPattern.Planning:
      return 'planning';
    case AgenticPattern.MultiAgent:
      return 'multi_agent';
    default:
      return 'reflection';
  }
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { 
    messages, 
    currentConversationId, 
    createConversation, 
    loadConversation,
    sendMessage,
    updateConversation,
    sidebarOpen,
    toggleSidebar,
  } = useConversation();

  const [selectedPattern, setSelectedPattern] = useState<AgenticPattern>(AgenticPattern.Reflection);
  const [patternStates, setPatternStates] = useState<Record<AgenticPattern, PatternState>>(initialStates);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<AgenticPattern | 'global'>('global');
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [patternSettings, setPatternSettings] = useState<AllPatternSettings>(DEFAULT_PATTERN_SETTINGS);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [passwordResetModalOpen, setPasswordResetModalOpen] = useState(false);

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

  // Load conversation messages into UI when conversation changes
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      // Convert stored messages to LogEntry format
      const logEntries: LogEntry[] = messages.map((msg) => ({
        id: msg.id,
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
      }));

      setPatternStates(prev => ({
        ...prev,
        [selectedPattern]: {
          ...prev[selectedPattern],
          logEntries,
        }
      }));
    } else if (!currentConversationId) {
      // Clear log entries if no conversation is selected
      setPatternStates(prev => ({
        ...prev,
        [selectedPattern]: {
          ...prev[selectedPattern],
          logEntries: [],
        }
      }));
    }
  }, [currentConversationId, messages, selectedPattern]);

  const handleOpenSettings = (tab: AgenticPattern | 'global' = 'global') => {
      setSettingsInitialTab(tab);
      setIsSettingsOpen(true);
  }

  const handleOpenAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

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
      // Save user message if authenticated and conversation exists
      if (isAuthenticated && currentConversationId) {
        await sendMessage(prompt, 'user');
      } else if (isAuthenticated && !currentConversationId) {
        // Create new conversation if authenticated but no conversation selected
        const newConv = await createConversation(mapPatternToType(selectedPattern), prompt.substring(0, 50));
        await loadConversation(newConv.id);
        await sendMessage(prompt, 'user');
      }

      // Run the agentic pattern
      let fullResponse = '';
      const responseStreamCallback = (entry: LogEntry) => {
        if (entry.type === 'ai') {
          fullResponse = entry.content;
        }
        streamCallback(entry);
      };

      await runAgenticPattern(selectedPattern, prompt, responseStreamCallback, globalSettings, patternSettings);

      // Save assistant response if authenticated and conversation exists
      if (isAuthenticated && currentConversationId && fullResponse) {
        await sendMessage(fullResponse, 'assistant');
        
        // Update conversation title if it's still "New Conversation"
        const titleNeedsUpdate = prompt.length > 0;
        if (titleNeedsUpdate) {
          const title = prompt.substring(0, 50).replace(/\n/g, ' ').trim();
          await updateConversation(currentConversationId, { title });
        }
      }
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
      <Header 
        onOpenSettings={() => handleOpenSettings('global')}
        onToggleSidebar={toggleSidebar}
        onOpenAuthModal={() => handleOpenAuthModal('signin')}
      />
      {!isAuthenticated && <GuestBanner onSignInClick={() => handleOpenAuthModal('signin')} />}
      <div className="flex flex-1 min-h-0">
        <ConversationSidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          onOpenAuthModal={() => handleOpenAuthModal('signin')}
        />
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
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onPasswordResetClick={() => {
          setAuthModalOpen(false);
          setPasswordResetModalOpen(true);
        }}
      />
      <PasswordResetModal
        isOpen={passwordResetModalOpen}
        onClose={() => setPasswordResetModalOpen(false)}
      />
    </div>
  );
};

export default App;
