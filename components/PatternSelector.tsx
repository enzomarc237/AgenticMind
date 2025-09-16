
import React from 'react';
import { AgenticPattern } from '../types';
import { ReflectionIcon } from './icons/ReflectionIcon';
import { ToolUseIcon } from './icons/ToolUseIcon';
import { ReActIcon } from './icons/ReActIcon';
import { PlanningIcon } from './icons/PlanningIcon';
import { MultiAgentIcon } from './icons/MultiAgentIcon';

interface PatternSelectorProps {
  selectedPattern: AgenticPattern;
  onSelectPattern: (pattern: AgenticPattern) => void;
  isLoading: boolean;
  maxIterations: number;
  onMaxIterationsChange: (value: number) => void;
}

const patternIcons: Record<AgenticPattern, React.ReactNode> = {
  [AgenticPattern.Reflection]: <ReflectionIcon className="w-6 h-6 mr-3" />,
  [AgenticPattern.ToolUse]: <ToolUseIcon className="w-6 h-6 mr-3" />,
  [AgenticPattern.ReAct]: <ReActIcon className="w-6 h-6 mr-3" />,
  [AgenticPattern.Planning]: <PlanningIcon className="w-6 h-6 mr-3" />,
  [AgenticPattern.MultiAgent]: <MultiAgentIcon className="w-6 h-6 mr-3" />,
};

export const PatternSelector: React.FC<PatternSelectorProps> = ({ selectedPattern, onSelectPattern, isLoading, maxIterations, onMaxIterationsChange }) => {
  const showSettings = selectedPattern === AgenticPattern.ReAct || selectedPattern === AgenticPattern.MultiAgent;

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-200 mb-3">1. Choose an Agentic Pattern</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.values(AgenticPattern).map((pattern) => (
          <button
            key={pattern}
            disabled={isLoading}
            onClick={() => onSelectPattern(pattern)}
            className={`flex items-center text-left p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedPattern === pattern
                ? 'bg-gray-700 border-purple-500 shadow-lg'
                : 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {patternIcons[pattern]}
            <span className="text-gray-100 font-medium">{pattern.replace(/([A-Z])/g, ' $1').trim()}</span>
          </button>
        ))}
      </div>
      
      <div className={`mt-4 transition-all duration-300 ease-in-out ${showSettings ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <label htmlFor="max-iterations" className="text-gray-300 font-medium whitespace-nowrap">
              Agent Loop Limit:
            </label>
            <div className="flex items-center gap-2 flex-grow">
               <input
                type="range"
                id="max-iterations"
                min="1"
                max="10"
                value={maxIterations}
                onChange={(e) => onMaxIterationsChange(Number(e.target.value))}
                disabled={isLoading}
                className="w-full cursor-pointer accent-purple-500"
              />
              <span className="text-purple-400 font-semibold w-8 text-center">{maxIterations}</span>
            </div>
            <p className="text-xs text-gray-500 ml-auto hidden md:block">
              Max iterations for ReAct & Multi-Agent patterns.
            </p>
          </div>
      </div>
    </div>
  );
};
