'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldX, Home, LogIn } from 'lucide-react'
import Link from 'next/link'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { useAuth } from '@/hooks/useAuth'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  // Wait for Zustand persist to rehydrate from localStorage before checking auth
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    // Not logged in at all — send to login with redirect param
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
    }
    // Note: wrong-role case is handled inline below (no silent redirect to /)
  }, [hydrated, isAuthenticated, router])

  // ── Loading state during Zustand rehydration ──────────────────────────────
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // ── Not authenticated: blank while redirect fires ─────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // ── Authenticated but wrong role: show inline 403 ─────────────────────────
  if (user.role !== 'admin' && user.role !== 'production_staff') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-10 w-10 text-red-500" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-red-500">
            403 — Access Denied
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold text-gray-900">
            Admin access required
          </h1>
          <p className="mt-4 text-base text-gray-500">
            Your account (<span className="font-medium text-gray-700">{user.email}</span>) does not
            have admin or staff permissions. Contact your administrator if you need access.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 sm:w-auto"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
            <Link
              href="/login?redirect=/admin"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
            >
              <LogIn className="h-4 w-4" />
              Sign in with admin account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Authorised: render admin shell ────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  )
}
