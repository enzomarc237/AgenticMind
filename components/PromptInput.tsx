import React from 'react';
import { PATTERN_DESCRIPTIONS } from '../constants';
import { AgenticPattern } from '../types';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  selectedPattern: AgenticPattern;
}

export const PromptInput: React.FC<PromptInputProps> = ({ prompt, onPromptChange, onSubmit, isLoading, selectedPattern }) => {
  const { title, description, promptPlaceholder } = PATTERN_DESCRIPTIONS[selectedPattern];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) {
        onSubmit();
      }
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        </div>
        
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">2. Enter Your Prompt</h2>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={promptPlaceholder}
            disabled={isLoading}
            rows={3}
            className="w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 p-4 pr-32 rounded-lg border-2 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all resize-none disabled:opacity-50"
          />
          <button
            onClick={onSubmit}
            disabled={isLoading || !prompt.trim()}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            Execute
          </button>
        </div>
      </div>
    </div>
  );
};
