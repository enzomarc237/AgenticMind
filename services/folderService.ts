import { supabase } from '../lib/supabaseClient'
import { Folder } from '../types'

/**
 * Folder Service
 * Handles all database operations for folders
 */

export async function fetchFolders(userId: string): Promise<Folder[]> {
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching folders:', error)
    throw new Error('Unable to load folders. Please try again.')
  }
}

export async function createFolder(
  userId: string,
  name: string,
  color?: string
): Promise<Folder> {
  try {
    // Get the highest order_index for this user
    const { data: folders } = await supabase
      .from('folders')
      .select('order_index')
      .eq('user_id', userId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = folders && folders.length > 0 ? folders[0].order_index + 1 : 0

    const { data, error } = await supabase
      .from('folders')
      .insert({
        user_id: userId,
        name,
        color,
        order_index: nextOrderIndex,
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error creating folder:', error)
    throw new Error('Unable to create folder. Please try again.')
  }
}

export async function updateFolder(
  folderId: string,
  updates: Partial<Folder>
): Promise<Folder> {
  try {
    const { data, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', folderId)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error updating folder:', error)
    throw new Error('Unable to update folder. Please try again.')
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  try {
    // First, unassign all conversations from this folder
    await supabase
      .from('conversations')
      .update({ folder_id: null })
      .eq('folder_id', folderId)

    // Then delete the folder
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting folder:', error)
    throw new Error('Unable to delete folder. Please try again.')
  }
}

export async function moveConversationToFolder(
  conversationId: string,
  folderId: string | null
): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ folder_id: folderId })
      .eq('id', conversationId)

    if (error) throw error
  } catch (error) {
    console.error('Error moving conversation:', error)
    throw new Error('Unable to move conversation. Please try again.')
  }
}

export async function reorderFolders(userId: string, folderOrders: { id: string; order_index: number }[]): Promise<void> {
  try {
    // Update each folder's order_index
    const updates = folderOrders.map(({ id, order_index }) =>
      supabase
        .from('folders')
        .update({ order_index })
        .eq('id', id)
        .eq('user_id', userId)
    )

    await Promise.all(updates)
  } catch (error) {
    console.error('Error reordering folders:', error)
    throw new Error('Unable to reorder folders. Please try again.')
  }
}
