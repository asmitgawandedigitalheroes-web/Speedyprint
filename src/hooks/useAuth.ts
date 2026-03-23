'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface AuthState {
  user: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: Profile | null) => void
  login: (email: string, password: string) => Promise<{ error: string | null }>
  register: (email: string, password: string, fullName: string, companyName?: string) => Promise<{ error: string | null; emailConfirmationRequired?: boolean }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email, password) => {
        set({ isLoading: true })
        const supabase = createClient()

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          set({ isLoading: false })
          return { error: error.message }
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          set({
            user: profile,
            isAuthenticated: true,
            isLoading: false,
          })
        }

        return { error: null }
      },

      register: async (email, password, fullName, companyName) => {
        set({ isLoading: true })
        const supabase = createClient()

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        })

        if (error) {
          set({ isLoading: false })
          return { error: error.message }
        }

        if (data.user) {
          // Email confirmation pending — session is null until user confirms
          if (!data.session) {
            set({ isLoading: false })
            return { error: null, emailConfirmationRequired: true }
          }

          // Update profile with company name if provided
          if (companyName) {
            await supabase
              .from('profiles')
              .update({ company_name: companyName, full_name: fullName })
              .eq('id', data.user.id)
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          set({
            user: profile,
            isAuthenticated: true,
            isLoading: false,
          })
        }

        return { error: null }
      },

      logout: async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        set({ user: null, isAuthenticated: false })
      },

      resetPassword: async (email) => {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          return { error: data.error || 'Failed to send reset email' }
        }
        return { error: null }
      },

      updatePassword: async (newPassword) => {
        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        return { error: error?.message || null }
      },

      refreshProfile: async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          set({ user: profile, isAuthenticated: true })
        } else {
          set({ user: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'sp-auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
