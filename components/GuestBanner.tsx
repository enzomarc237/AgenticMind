import React, { useState } from 'react'

interface GuestBannerProps {
  onSignInClick: () => void
}

export default function GuestBanner({ onSignInClick }: GuestBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    // Check if banner was dismissed in this session
    return sessionStorage.getItem('guestBannerDismissed') === 'true'
  })

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('guestBannerDismissed', 'true')
  }

  if (dismissed) return null

  return (
    <div className="bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-300 dark:border-yellow-700 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You're using AgenticMind as a guest. Sign in to save your conversations and settings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSignInClick}
            className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
