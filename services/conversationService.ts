import { supabase } from '../lib/supabaseClient'
import { Conversation, Message, AgenticPatternType } from '../types'

/**
 * Conversation Service
 * Handles all database operations for conversations and messages
 */

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching conversations:', error)
    throw new Error('Unable to load conversations. Please try again.')
  }
}

export async function fetchConversation(conversationId: string): Promise<Conversation | null> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching conversation:', error)
    throw new Error('Unable to load conversation. Please try again.')
  }
}

export async function createConversation(
  userId: string,
  pattern: AgenticPatternType,
  title: string = 'New Conversation'
): Promise<Conversation> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        pattern,
        title,
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error creating conversation:', error)
    throw new Error('Unable to create conversation. Please try again.')
  }
}

export async function updateConversation(
  conversationId: string,
  updates: Partial<Conversation>
): Promise<Conversation> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error updating conversation:', error)
    throw new Error('Unable to update conversation. Please try again.')
  }
}

export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting conversation:', error)
    throw new Error('Unable to delete conversation. Please try again.')
  }
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw new Error('Unable to load messages. Please try again.')
  }
}

export async function createMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: any
): Promise<Message> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata,
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error creating message:', error)
    throw new Error('Unable to save message. Please try again.')
  }
}

export async function deleteMessage(messageId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting message:', error)
    throw new Error('Unable to delete message. Please try again.')
  }
}

export async function searchConversations(userId: string, query: string): Promise<Conversation[]> {
  try {
    // Search in conversation titles
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .ilike('title', `%${query}%`)
      .order('last_message_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error searching conversations:', error)
    throw new Error('Unable to search conversations. Please try again.')
  }
}
