import React from 'react';
import { SettingsIcon } from './icons/SettingsIcon';

interface HeaderProps {
    onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="relative text-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
      <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500 dark:from-purple-400 dark:to-cyan-400">
        AgenticMind
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">
        Stop Prompting, Start Designing: Explore 5 Agentic AI Patterns
      </p>
       <button 
        onClick={onOpenSettings}
        className="absolute top-1/2 right-4 -translate-y-1/2 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Open settings"
      >
        <SettingsIcon className="w-6 h-6" />
      </button>
    </header>
  );
};
