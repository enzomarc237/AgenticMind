import { supabase } from '../lib/supabaseClient'
import { Tag } from '../types'

/**
 * Tag Service
 * Handles all database operations for tags and conversation-tag relationships
 */

export async function fetchTags(userId: string): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching tags:', error)
    throw new Error('Unable to load tags. Please try again.')
  }
}

export async function createTag(
  userId: string,
  name: string,
  color?: string
): Promise<Tag> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: userId,
        name,
        color,
      })
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        throw new Error('You already have a tag with this name')
      }
      throw error
    }

    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    console.error('Error creating tag:', error)
    throw new Error('Unable to create tag. Please try again.')
  }
}

export async function updateTag(
  tagId: string,
  updates: Partial<Tag>
): Promise<Tag> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId)
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        throw new Error('You already have a tag with this name')
      }
      throw error
    }

    return data
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    console.error('Error updating tag:', error)
    throw new Error('Unable to update tag. Please try again.')
  }
}

export async function deleteTag(tagId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting tag:', error)
    throw new Error('Unable to delete tag. Please try again.')
  }
}

export async function fetchConversationTags(conversationId: string): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from('conversation_tags')
      .select('tag_id, tags(*)')
      .eq('conversation_id', conversationId)

    if (error) throw error

    return data?.map((item: any) => item.tags) || []
  } catch (error) {
    console.error('Error fetching conversation tags:', error)
    throw new Error('Unable to load tags. Please try again.')
  }
}

export async function addTagToConversation(
  conversationId: string,
  tagId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversation_tags')
      .insert({
        conversation_id: conversationId,
        tag_id: tagId,
      })

    if (error) {
      // Ignore duplicate errors (tag already on conversation)
      if (error.code === '23505') {
        return
      }
      throw error
    }
  } catch (error) {
    console.error('Error adding tag to conversation:', error)
    throw new Error('Unable to add tag. Please try again.')
  }
}

export async function removeTagFromConversation(
  conversationId: string,
  tagId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversation_tags')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('tag_id', tagId)

    if (error) throw error
  } catch (error) {
    console.error('Error removing tag from conversation:', error)
    throw new Error('Unable to remove tag. Please try again.')
  }
}

export async function fetchTagUsageCount(tagId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('conversation_tags')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', tagId)

    if (error) throw error

    return count || 0
  } catch (error) {
    console.error('Error fetching tag usage count:', error)
    return 0
  }
}
