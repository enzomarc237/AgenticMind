import React, { useState } from 'react';
import { SettingsIcon } from './icons/SettingsIcon';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
    onOpenSettings: () => void;
    onToggleSidebar?: () => void;
    onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onToggleSidebar, onOpenAuthModal }) => {
  const { user, isAuthenticated, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="relative text-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
      {/* Hamburger menu button (left side) */}
      {onToggleSidebar && (
        <button 
          onClick={onToggleSidebar}
          className="absolute top-1/2 left-4 -translate-y-1/2 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500 dark:from-purple-400 dark:to-cyan-400">
        AgenticMind
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">
        Stop Prompting, Start Designing: Explore 5 Agentic AI Patterns
      </p>

      {/* Authentication UI (right side) */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center gap-2">
        {!isAuthenticated ? (
          // Not logged in - show Sign In button
          <button 
            onClick={onOpenAuthModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Sign In
          </button>
        ) : (
          // Logged in - show user menu
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm">{user?.email || 'User'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <button
                  onClick={() => {
                    onOpenSettings();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
