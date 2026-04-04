'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      
      if (errorCode === 'otp_expired' || errorCode === 'access_denied') {
        router.push(`/reset-password?error=${errorCode}`)
      }
    }
  }, [pathname, router])

  return <>{children}</>
}
