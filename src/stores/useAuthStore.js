import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  // Set user data
  setUser: (user) => set({ user, error: null }),
  
  // Set loading state
  setLoading: (loading) => set({ loading }),
  
  // Set error
  setError: (error) => set({ error }),
  
  // Clear auth state
  clearAuth: () => set({ user: null, loading: false, error: null }),

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null })
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })

      if (error) {
        console.error('Google sign in error:', error)
        set({ error: error.message, loading: false })
        return { success: false, error: error.message }
      }

      // Note: The user will be set via the auth state change listener
      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      const errorMessage = error.message || 'Failed to sign in with Google'
      set({ error: errorMessage, loading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Sign out
  signOut: async () => {
    try {
      set({ loading: true, error: null })
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        set({ error: error.message, loading: false })
        return { success: false, error: error.message }
      }

      set({ user: null, loading: false, error: null })
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      const errorMessage = error.message || 'Failed to sign out'
      set({ error: errorMessage, loading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get current session
  getCurrentSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Get session error:', error)
        set({ error: error.message })
        return null
      }

      return session
    } catch (error) {
      console.error('Get session error:', error)
      set({ error: error.message })
      return null
    }
  },

  // Get user profile
  getUserProfile: async () => {
    const { user } = get()
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Get profile error:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Get profile error:', error)
      return null
    }
  },

  // Update user profile
  updateUserProfile: async (updates) => {
    const { user } = get()
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          email: user.email,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Update profile error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: error.message }
    }
  }
}))