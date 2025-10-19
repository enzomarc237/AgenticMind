import React from 'react'
import { Conversation, AgenticPatternType } from '../types'

interface ConversationListItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onToggleFavorite: (e: React.MouseEvent) => void
}

const patternColors: Record<AgenticPatternType, string> = {
  reflection: 'bg-blue-500',
  tool_use: 'bg-green-500',
  react: 'bg-orange-500',
  planning: 'bg-purple-500',
  multi_agent: 'bg-red-500',
}

const patternLabels: Record<AgenticPatternType, string> = {
  reflection: 'reflection',
  tool_use: 'tool use',
  react: 'react',
  planning: 'planning',
  multi_agent: 'multi agent',
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function ConversationListItem({
  conversation,
  isActive,
  onClick,
  onContextMenu,
  onToggleFavorite,
}: ConversationListItemProps) {
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`
        group cursor-pointer p-3 border-l-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
        ${
          isActive
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
            : 'border-transparent'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={`
              text-sm font-medium line-clamp-2 mb-1
              ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}
            `}
          >
            {conversation.title}
          </h3>

          {/* Pattern badge */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`
                ${patternColors[conversation.pattern]}
                text-white text-xs px-2 py-0.5 rounded-full
              `}
            >
              {patternLabels[conversation.pattern]}
            </span>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getRelativeTime(conversation.last_message_at)}
          </p>
        </div>

        {/* Favorite icon */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(e)
          }}
          className={`
            p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
            ${conversation.is_favorite ? 'opacity-100' : ''}
          `}
          aria-label={conversation.is_favorite ? 'Unfavorite' : 'Favorite'}
        >
          {conversation.is_favorite ? (
            <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
