import React, { useState, useEffect } from 'react';
import { AgenticPattern } from '../types';
import { GlobalSettings, AllPatternSettings, ReActSettings, MultiAgentSettings } from '../settings';
import { CloseIcon } from './icons/CloseIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalSettings: GlobalSettings;
  onGlobalSettingsChange: (settings: GlobalSettings) => void;
  patternSettings: AllPatternSettings;
  onPatternSettingsChange: (settings: AllPatternSettings) => void;
  initialTab?: AgenticPattern | 'global';
}

type Tab = AgenticPattern | 'global';

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; }> = ({ label, value, min, max, step, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <div className="flex items-center gap-4 mt-1">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
            />
            <span className="text-purple-600 dark:text-purple-400 font-semibold w-12 text-center">{value.toFixed(2)}</span>
        </div>
    </div>
);

const TextArea: React.FC<{ label: string; value: string; onChange: (value: string) => void; rows?: number; description?: string; }> = ({ label, value, onChange, rows = 8, description }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={rows}
            className="mt-1 block w-full rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm text-gray-900 dark:text-gray-200"
        />
        {description && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, globalSettings, onGlobalSettingsChange, patternSettings, onPatternSettingsChange, initialTab = 'global' }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
      if (isOpen) {
          setActiveTab(initialTab);
      }
  }, [isOpen, initialTab]);
  
  if (!isOpen) return null;

  const handlePatternSettingChange = <K extends AgenticPattern>(pattern: K, key: keyof AllPatternSettings[K], value: any) => {
    onPatternSettingsChange({
      ...patternSettings,
      [pattern]: {
        ...patternSettings[pattern],
        [key]: value
      }
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'global':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Global Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
              <div className="mt-2 flex gap-2">
                <button onClick={() => onGlobalSettingsChange({ ...globalSettings, theme: 'light' })} className={`px-4 py-2 rounded-md text-sm ${globalSettings.theme === 'light' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Light</button>
                <button onClick={() => onGlobalSettingsChange({ ...globalSettings, theme: 'dark' })} className={`px-4 py-2 rounded-md text-sm ${globalSettings.theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Dark</button>
              </div>
            </div>
            <Slider label="Temperature" value={globalSettings.temperature} min={0} max={1} step={0.01} onChange={val => onGlobalSettingsChange({ ...globalSettings, temperature: val })} />
            <Slider label="Top-K" value={globalSettings.topK} min={1} max={100} step={1} onChange={val => onGlobalSettingsChange({ ...globalSettings, topK: val })} />
            <Slider label="Top-P" value={globalSettings.topP} min={0} max={1} step={0.01} onChange={val => onGlobalSettingsChange({ ...globalSettings, topP: val })} />
          </div>
        );
      case AgenticPattern.Reflection:
        // FIX: Destructured settings for consistency, which may resolve hidden type inference issues.
        const reflectionSettings = patternSettings.Reflection;
        return (
            <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reflection Settings</h3>
                <TextArea
                    label="Refinement Prompt"
                    value={reflectionSettings.refinementPrompt}
                    onChange={val => handlePatternSettingChange(AgenticPattern.Reflection, 'refinementPrompt', val)}
                    description='Customize the prompt used for the reflection step. Use {prompt} for the original user prompt and {initialResponse} for the AI's first draft.'
                />
            </div>
        );
     case AgenticPattern.ToolUse:
        return (
             <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Tool Use Settings</h3>
                <p className="text-gray-600 dark:text-gray-400">No specific settings are available for this pattern. It always uses Google Search.</p>
            </div>
        )
      case AgenticPattern.ReAct:
        const reactSettings = patternSettings.ReAct;
        return (
             <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">ReAct Settings</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agent Loop Limit</label>
                    <div className="flex items-center gap-4 mt-1">
                        <input type="range" min={1} max={10} value={reactSettings.maxIterations} onChange={e => handlePatternSettingChange(AgenticPattern.ReAct, 'maxIterations', Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500" />
                        <span className="text-purple-600 dark:text-purple-400 font-semibold w-8 text-center">{reactSettings.maxIterations}</span>
                    </div>
                </div>
                <TextArea label="System Instruction" value={reactSettings.systemInstruction} onChange={val => handlePatternSettingChange(AgenticPattern.ReAct, 'systemInstruction', val)} rows={12} />
            </div>
        );
      case AgenticPattern.Planning:
        const planningSettings = patternSettings.Planning;
        return (
             <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Planning Settings</h3>
                <TextArea label="Planning Prompt" value={planningSettings.planningPrompt} onChange={val => handlePatternSettingChange(AgenticPattern.Planning, 'planningPrompt', val)} description="Customize the prompt used to generate the plan. Use {prompt} for the original user prompt." />
                <TextArea label="Execution Prompt" value={planningSettings.executionPrompt} onChange={val => handlePatternSettingChange(AgenticPattern.Planning, 'executionPrompt', val)} description="Customize the prompt used to execute the plan. Use {prompt} for the original user prompt and {plan} for the generated plan." />
            </div>
        )
      case AgenticPattern.MultiAgent:
         const multiAgentSettings = patternSettings.MultiAgent;
        return (
             <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Multi-Agent Settings</h3>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agent Loop Limit</label>
                    <div className="flex items-center gap-4 mt-1">
                        <input type="range" min={1} max={10} value={multiAgentSettings.maxIterations} onChange={e => handlePatternSettingChange(AgenticPattern.MultiAgent, 'maxIterations', Number(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500" />
                        <span className="text-purple-600 dark:text-purple-400 font-semibold w-8 text-center">{multiAgentSettings.maxIterations}</span>
                    </div>
                </div>
                <TextArea label="Coder Agent System Instruction" value={multiAgentSettings.coderSystemInstruction} onChange={val => handlePatternSettingChange(AgenticPattern.MultiAgent, 'coderSystemInstruction', val)} />
                <TextArea label="Reviewer Agent System Instruction" value={multiAgentSettings.reviewerSystemInstruction} onChange={val => handlePatternSettingChange(AgenticPattern.MultiAgent, 'reviewerSystemInstruction', val)} />
            </div>
        );
      default:
        return null;
    }
  };

  const tabs: { id: Tab; label: string }[] = [
      { id: 'global', label: 'Global' },
      ...Object.values(AgenticPattern).map(p => ({ id: p, label: p.replace(/([A-Z])/g, ' $1').trim() }))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-1/4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <nav className="p-4 space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>
          <main className="w-3/4 p-6 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
             <button onClick={onClose} className="px-6 py-2 rounded-md bg-purple-600 text-white font-semibold hover:bg-purple-700">Done</button>
        </div>
      </div>
    </div>
  );
};