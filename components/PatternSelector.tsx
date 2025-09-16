import React from 'react';
import { AgenticPattern } from '../types';
import { ReflectionIcon } from './icons/ReflectionIcon';
import { ToolUseIcon } from './icons/ToolUseIcon';
import { ReActIcon } from './icons/ReActIcon';
import { PlanningIcon } from './icons/PlanningIcon';
import { MultiAgentIcon } from './icons/MultiAgentIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface PatternSelectorProps {
  selectedPattern: AgenticPattern;
  onSelectPattern: (pattern: AgenticPattern) => void;
  isLoading: boolean;
  onConfigurePattern: (pattern: AgenticPattern) => void;
}

const patternIcons: Record<AgenticPattern, React.ReactNode> = {
  [AgenticPattern.Reflection]: <ReflectionIcon className="w-6 h-6 mr-3" />,
  [AgenticPattern.ToolUse]: <ToolUseIcon className="w-6 h-6 mr-3" />,
  [AgenticPattern.ReAct]: <ReActIcon className="w-6 h-6 mr-3" />,
  [AgenticPattern.Planning]: <PlanningIcon className="w-6 h-6 mr-3" />,
  [AgenticPattern.MultiAgent]: <MultiAgentIcon className="w-6 h-6 mr-3" />,
};

export const PatternSelector: React.FC<PatternSelectorProps> = ({ selectedPattern, onSelectPattern, isLoading, onConfigurePattern }) => {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
         <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">1. Choose an Agentic Pattern</h2>
         <button 
            onClick={() => onConfigurePattern(selectedPattern)}
            className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium transition-colors"
        >
            <SettingsIcon className="w-4 h-4" />
            Configure Pattern
         </button>
      </div>
     
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.values(AgenticPattern).map((pattern) => (
          <button
            key={pattern}
            disabled={isLoading}
            onClick={() => onSelectPattern(pattern)}
            className={`flex items-center text-left p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedPattern === pattern
                ? 'bg-gray-100 dark:bg-gray-700 border-purple-500 shadow-lg'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {patternIcons[pattern]}
            <span className="text-gray-800 dark:text-gray-100 font-medium">{pattern.replace(/([A-Z])/g, ' $1').trim()}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
