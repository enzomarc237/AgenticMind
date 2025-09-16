
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center p-4 md:p-6 border-b border-gray-700">
      <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
        AgenticMind
      </h1>
      <p className="text-gray-400 mt-2 text-sm md:text-base">
        Stop Prompting, Start Designing: Explore 5 Agentic AI Patterns
      </p>
    </header>
  );
};
