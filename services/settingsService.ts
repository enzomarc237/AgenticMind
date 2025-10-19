import { supabase } from '../lib/supabaseClient'
import { UserProfile, UserSettings } from '../types'

/**
 * Settings Service
 * Handles all database operations for user profiles and settings
 */

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw new Error('Unable to load profile. Please try again.')
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw new Error('Unable to update profile. Please try again.')
  }
}

export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error fetching user settings:', error)
    throw new Error('Unable to load settings. Please try again.')
  }
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  try {
    // First check if settings exist for this user
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new settings if they don't exist
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          ...settings,
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('Error updating user settings:', error)
    throw new Error('Unable to save settings. Please try again.')
  }
}

export async function createDefaultUserSettings(userId: string): Promise<UserSettings> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error creating default user settings:', error)
    throw new Error('Unable to create settings. Please try again.')
  }
}
