import React, { useState } from 'react'
import { useConversation } from '../contexts/ConversationContext'
import { useAuth } from '../hooks/useAuth'
import ConversationListItem from './ConversationListItem'
import ContextMenu, { ContextMenuItem } from './ContextMenu'
import { AgenticPatternType } from '../types'

interface ConversationSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onOpenAuthModal?: () => void
}

export default function ConversationSidebar({ isOpen, onToggle, onOpenAuthModal }: ConversationSidebarProps) {
  const { isAuthenticated } = useAuth()
  const {
    conversations,
    currentConversationId,
    createConversation,
    loadConversation,
    updateConversation,
    deleteConversation,
    searchConversations,
  } = useConversation()

  const [searchQuery, setSearchQuery] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean
    position: { x: number; y: number }
    conversationId: string | null
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    conversationId: null,
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleNewConversation = async () => {
    if (!isAuthenticated) {
      onOpenAuthModal?.()
      return
    }

    setIsCreating(true)
    try {
      // Default to reflection pattern for new conversations
      const newConv = await createConversation('reflection')
      await loadConversation(newConv.id)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchConversations(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    searchConversations('')
  }

  const handleConversationClick = async (conversationId: string) => {
    try {
      await loadConversation(conversationId)
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault()
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      conversationId,
    })
  }

  const handleToggleFavorite = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    const conversation = conversations.find((c) => c.id === conversationId)
    if (!conversation) return

    try {
      await updateConversation(conversationId, {
        is_favorite: !conversation.is_favorite,
      })
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Delete this conversation? This cannot be undone.')) {
      return
    }

    try {
      await deleteConversation(conversationId)
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      alert('Failed to delete conversation. Please try again.')
    }
  }

  const handleRenameConversation = async (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId)
    if (!conversation) return

    const newTitle = prompt('Enter new title:', conversation.title)
    if (!newTitle || newTitle === conversation.title) return

    try {
      await updateConversation(conversationId, { title: newTitle.trim() })
    } catch (error) {
      console.error('Failed to rename conversation:', error)
      alert('Failed to rename conversation. Please try again.')
    }
  }

  const handleArchiveConversation = async (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId)
    if (!conversation) return

    try {
      await updateConversation(conversationId, {
        is_archived: !conversation.is_archived,
      })
    } catch (error) {
      console.error('Failed to archive conversation:', error)
    }
  }

  const contextMenuItems: ContextMenuItem[] = contextMenu.conversationId
    ? [
        {
          label: 'Rename',
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          ),
          onClick: () => handleRenameConversation(contextMenu.conversationId!),
        },
        {
          label: conversations.find((c) => c.id === contextMenu.conversationId)?.is_archived
            ? 'Unarchive'
            : 'Archive',
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          ),
          onClick: () => handleArchiveConversation(contextMenu.conversationId!),
        },
        {
          label: 'Delete',
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          ),
          onClick: () => handleDeleteConversation(contextMenu.conversationId!),
          danger: true,
        },
      ]
    : []

  const activeConversations = conversations.filter((c) => !c.is_archived)
  const archivedConversations = conversations.filter((c) => c.is_archived)

  if (!isAuthenticated) {
    return (
      <aside
        className={`
          ${isOpen ? 'w-80' : 'w-0'}
          transition-all duration-300 overflow-hidden
          border-r border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900
        `}
      >
        {isOpen && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Sign in to see your conversations
            </p>
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
      </aside>
    )
  }

  return (
    <>
      <aside
        className={`
          ${isOpen ? 'w-80' : 'w-0'}
          transition-all duration-300 overflow-hidden
          border-r border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900
          flex flex-col
        `}
      >
        {isOpen && (
          <>
            {/* Sidebar header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleNewConversation}
                disabled={isCreating}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {isCreating ? 'Creating...' : 'New Conversation'}
              </button>
            </div>

            {/* Search bar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {activeConversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <p className="mb-2">No conversations yet</p>
                  <p className="text-sm">Create your first conversation</p>
                </div>
              ) : (
                <div>
                  {activeConversations.map((conversation) => (
                    <ConversationListItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === currentConversationId}
                      onClick={() => handleConversationClick(conversation.id)}
                      onContextMenu={(e) => handleContextMenu(e, conversation.id)}
                      onToggleFavorite={(e) => handleToggleFavorite(e, conversation.id)}
                    />
                  ))}
                </div>
              )}

              {/* Archived section */}
              {archivedConversations.length > 0 && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Archived ({archivedConversations.length})
                  </div>
                  {archivedConversations.map((conversation) => (
                    <ConversationListItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === currentConversationId}
                      onClick={() => handleConversationClick(conversation.id)}
                      onContextMenu={(e) => handleContextMenu(e, conversation.id)}
                      onToggleFavorite={(e) => handleToggleFavorite(e, conversation.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {/* Context menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        items={contextMenuItems}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
      />
    </>
  )
}
