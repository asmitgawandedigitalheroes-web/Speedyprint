'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { useCart } from '@/hooks/useCart'

interface AuthState {
  user: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: Profile | null) => void
  login: (email: string, password: string) => Promise<{ error: string | null; emailNotConfirmed?: boolean }>
  register: (email: string, password: string, fullName: string, companyName?: string, marketingOptIn?: boolean) => Promise<{ error: string | null; emailConfirmationRequired?: boolean }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      // BUG-001/002 FIX: Start as true so admin/account layouts wait for AuthProvider's
      // refreshProfile() call before deciding to redirect. Without this, child component
      // effects (setHydrated) fire before the parent AuthProvider effect, so the layout
      // sees isLoading=false+isAuthenticated=false and immediately redirects to /login
      // even when the user IS authenticated — causing session-drop loops.
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email, password) => {
        set({ isLoading: true })
        const supabase = createClient()

        const trimmedEmail = email.trim()
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        })

        if (error) {
          set({ isLoading: false })
          console.error('[useAuth] Login error:', error.message)
          if (error.message.toLowerCase().includes('email not confirmed')) {
            return { error: 'Please confirm your email address before signing in.', emailNotConfirmed: true }
          }
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

      register: async (email, password, fullName, companyName, marketingOptIn = false) => {
        set({ isLoading: true })
        const supabase = createClient()

        const trimmedEmail = email.trim()
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { full_name: fullName },
          },
        })

        if (error) {
          set({ isLoading: false })
          // BUG-010 FIX: Map raw Supabase error messages to user-friendly text.
          // Also addresses BUG-015 (user enumeration): raw messages like "User already registered"
          // reveal whether an email exists in the system. Use a neutral, actionable message instead.
          if (
            error.message.toLowerCase().includes('already registered') ||
            error.message.toLowerCase().includes('already exists') ||
            error.message.toLowerCase().includes('email address is already')
          ) {
            return { error: 'An account with this email already exists. Try signing in instead.' }
          }
          return { error: 'Registration failed. Please check your details and try again.' }
        }

        if (data.user) {
          // Email confirmation pending — session is null until user confirms
          // Still persist consent fields now; profile row exists from the auth trigger
          if (!data.session) {
            await supabase
              .from('profiles')
              .update({
                full_name: fullName,
                ...(companyName ? { company_name: companyName } : {}),
                marketing_opt_in: marketingOptIn,
                terms_accepted_at: new Date().toISOString(),
              })
              .eq('id', data.user.id)
            set({ isLoading: false })
            return { error: null, emailConfirmationRequired: true }
          }

          // Update profile with registration metadata
          await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              ...(companyName ? { company_name: companyName } : {}),
              marketing_opt_in: marketingOptIn,
              terms_accepted_at: new Date().toISOString(),
            })
            .eq('id', data.user.id)

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
        try {
          const supabase = createClient()
          // BUG-015 FIX: Set isLoading to false immediately so the next state
          // isn't stuck in a "waiting" mode.
          set({ isLoading: false })
          
          await supabase.auth.signOut()
          
          // BUG-029 FIX: Clear the cart on logout so the next user (or role) sees a fresh cart.
          // Without this, persisted cart items from a customer session were visible to admin/staff
          // logins and to different customers sharing the same browser.
          useCart.getState().clearCart()
          set({ user: null, isAuthenticated: false, isLoading: false })
        } catch (err) {
          console.error('[useAuth] Logout error:', err)
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },

      resetPassword: async (email) => {
        const trimmedEmail = email.trim()
        try {
          const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: trimmedEmail }),
          })
          const data = await res.json()
          if (!res.ok) {
            return { error: data.error || 'Failed to send reset email.' }
          }
          return { error: null }
        } catch (err) {
          console.error('[useAuth] Reset password error:', err)
          return { error: 'Failed to send reset email. Please try again.' }
        }
      },

      updatePassword: async (newPassword) => {
        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        return { error: error?.message || null }
      },

      refreshProfile: async () => {
        set({ isLoading: true })
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()

          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            set({ user: profile, isAuthenticated: true, isLoading: false })
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false })
          }
        } catch (error) {
          console.error('Error refreshing profile:', error)
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'sp-auth-storage',
      // BUG-014 FIX: Do NOT persist the full user object in localStorage.
      // Storing email, phone, address, and role unencrypted in localStorage exposes
      // sensitive data to XSS attacks and malicious browser extensions.
      // Only persist a minimal flag; always re-fetch the full profile from Supabase on load.
      partialize: () => ({ wasLoggedIn: true }),
    }
  )
)
