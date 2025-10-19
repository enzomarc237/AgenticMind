import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const mapAuthError = (error: AuthError): string => {
    const message = error.message.toLowerCase()

    // Sign up errors
    if (message.includes('user already registered')) {
      return 'An account with this email already exists'
    }
    if (message.includes('invalid email')) {
      return 'Please enter a valid email address'
    }

    // Sign in errors
    if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
      return 'Email or password is incorrect'
    }
    if (message.includes('email not confirmed')) {
      return 'Please verify your email address. Check your inbox for a confirmation link.'
    }
    if (message.includes('user not found')) {
      return 'Email or password is incorrect'
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('too many')) {
      return 'Too many attempts. Please wait a few minutes and try again.'
    }

    // Network errors
    if (message.includes('fetch') || message.includes('network')) {
      return 'Connection error. Please check your internet and try again.'
    }

    // Default fallback
    return 'An unexpected error occurred. Please try again later.'
  }

  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
      })

      if (error) {
        throw new Error(mapAuthError(error))
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unable to create account. Please try again later.')
    }
  }

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(mapAuthError(error))
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unable to sign in. Please try again later.')
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw new Error('Unable to sign out. Please try again.')
      }
    } catch (error) {
      // Even if sign out fails, clear local state
      setUser(null)
      setSession(null)

      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unable to sign out. Please try again.')
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      })

      if (error) {
        // For security, don't reveal if email exists
        // Show generic success message
        if (error.message.includes('user not found') || error.message.includes('not found')) {
          return // Silently succeed
        }
        throw new Error('Connection error. Please try again.')
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Connection error. Please try again.')
    }
  }

  const updatePassword = async (newPassword: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw new Error('Unable to update password. Please try again.')
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unable to update password. Please try again.')
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
