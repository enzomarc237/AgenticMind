import React, { createContext, useContext, useEffect, useState } from 'react'
import { Conversation, Message, AgenticPatternType } from '../types'
import { useAuth } from '../hooks/useAuth'
import * as conversationService from '../services/conversationService'

interface ConversationContextType {
  conversations: Conversation[]
  currentConversationId: string | null
  messages: Message[]
  loading: boolean
  sidebarOpen: boolean
  createConversation: (pattern: AgenticPatternType, title?: string) => Promise<Conversation>
  deleteConversation: (id: string) => Promise<void>
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>
  loadConversation: (id: string) => Promise<void>
  sendMessage: (content: string, role: 'user' | 'assistant', metadata?: any) => Promise<void>
  searchConversations: (query: string) => void
  toggleSidebar: () => void
  refreshConversations: () => Promise<void>
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

export function useConversation() {
  const context = useContext(ConversationContext)
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider')
  }
  return context
}

interface ConversationProviderProps {
  children: React.ReactNode
}

export function ConversationProvider({ children }: ConversationProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Load sidebar state from localStorage
    const saved = localStorage.getItem('sidebarOpen')
    return saved ? JSON.parse(saved) : true
  })

  // Load conversations when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations()
    } else {
      // Clear conversations when user logs out
      setConversations([])
      setCurrentConversationId(null)
      setMessages([])
    }
  }, [isAuthenticated, user])

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen))
  }, [sidebarOpen])

  const loadConversations = async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await conversationService.fetchConversations(user.id)
      setConversations(data)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshConversations = async () => {
    await loadConversations()
  }

  const createConversation = async (
    pattern: AgenticPatternType,
    title: string = 'New Conversation'
  ): Promise<Conversation> => {
    if (!user) {
      throw new Error('You must be signed in to create conversations')
    }

    try {
      const newConversation = await conversationService.createConversation(user.id, pattern, title)
      setConversations((prev) => [newConversation, ...prev])
      setCurrentConversationId(newConversation.id)
      setMessages([])
      return newConversation
    } catch (error) {
      console.error('Failed to create conversation:', error)
      throw error
    }
  }

  const deleteConversation = async (id: string): Promise<void> => {
    try {
      await conversationService.deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))

      if (currentConversationId === id) {
        setCurrentConversationId(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      throw error
    }
  }

  const updateConversation = async (id: string, updates: Partial<Conversation>): Promise<void> => {
    try {
      const updated = await conversationService.updateConversation(id, updates)
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)))
    } catch (error) {
      console.error('Failed to update conversation:', error)
      throw error
    }
  }

  const loadConversation = async (id: string): Promise<void> => {
    setLoading(true)
    try {
      const conversationMessages = await conversationService.fetchMessages(id)
      setMessages(conversationMessages)
      setCurrentConversationId(id)
    } catch (error) {
      console.error('Failed to load conversation messages:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (
    content: string,
    role: 'user' | 'assistant',
    metadata?: any
  ): Promise<void> => {
    if (!currentConversationId) {
      throw new Error('No active conversation')
    }

    try {
      const newMessage = await conversationService.createMessage(
        currentConversationId,
        role,
        content,
        metadata
      )

      setMessages((prev) => [...prev, newMessage])

      // Update conversation's last_message_at (handled by database trigger)
      // Refresh conversations to get updated order
      if (user) {
        const data = await conversationService.fetchConversations(user.id)
        setConversations(data)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }

  const searchConversations = async (query: string) => {
    if (!user) return

    if (!query.trim()) {
      // If query is empty, reload all conversations
      await loadConversations()
      return
    }

    setLoading(true)
    try {
      const results = await conversationService.searchConversations(user.id, query)
      setConversations(results)
    } catch (error) {
      console.error('Failed to search conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev)
  }

  const value: ConversationContextType = {
    conversations,
    currentConversationId,
    messages,
    loading,
    sidebarOpen,
    createConversation,
    deleteConversation,
    updateConversation,
    loadConversation,
    sendMessage,
    searchConversations,
    toggleSidebar,
    refreshConversations,
  }

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>
}
