'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, refreshProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const supabase = createClient()

    // 1. Initial sync from Supabase session
    refreshProfile()

    // 2. Listen for auth changes to keep Zustand in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/reset-password?type=recovery')
      } else if (session?.user) {
        // If we have a session but no user in state, or if the user changed, refresh
        refreshProfile()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshProfile, setUser])

  // 2. Reactive Navigation Error Monitor
  // Checks for auth errors in the URL hash (e.g. #error_code=otp_expired) on every page visit.
  // This ensures that even layout-persistent redirects (like Home -> Login) trigger the recovery flow.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const errorCode = params.get('error_code')
      const type = params.get('type')
      const accessToken = params.get('access_token')
      
      if (errorCode === 'otp_expired' || errorCode === 'access_denied') {
        router.push(`/reset-password?error=${errorCode}`)
      } else if (type === 'recovery' || (accessToken && pathname === '/')) {
        // If landed on homepage with a recovery link or any auth hash, redirect to reset-password
        // Note: type=recovery is explicitly set by Supabase for recovery links.
        // If it's missing but there's an access_token on the homepage, it's likely a redirect fallback.
        if (pathname !== '/reset-password') {
          router.push('/reset-password?type=recovery')
        }
      }
    }
  }, [pathname, router])

  return <>{children}</>
}
