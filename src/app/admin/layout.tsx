'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2, ShieldX, Home, LogIn, Bell, ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { useAuth } from '@/hooks/useAuth'

/* ── Breadcrumb label map ── */
const ROUTE_LABELS: Record<string, string> = {
  '/admin':              'Dashboard',
  '/admin/orders':       'Order Pipeline',
  '/admin/proofs':       'Proofs',
  '/admin/production':   'Production',
  '/admin/csv':          'CSV Jobs',
  '/admin/products':     'Products',
  '/admin/templates':    'Templates',
  '/admin/designs':      'Designs',
  '/admin/blog':         'Blog',
  '/admin/testimonials': 'Testimonials',
  '/admin/users':        'Users',
  '/admin/settings':     'Settings',
}

function AdminTopBar() {
  const { user } = useAuth()
  const pathname = usePathname()

  const currentLabel =
    pathname === '/admin'
      ? 'Dashboard'
      : Object.entries(ROUTE_LABELS)
          .filter(([route]) => route !== '/admin')
          .sort((a, b) => b[0].length - a[0].length) // longest match first
          .find(([route]) => pathname.startsWith(route))?.[1]

  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[#E7E5E4] bg-white px-6 shadow-sm">
      {/* Breadcrumb — pl-14 on mobile so hamburger doesn't overlap */}
      <div className="flex items-center gap-1.5 pl-14 text-sm lg:pl-0">
        <span className="font-medium text-brand-text-muted">Admin</span>
        {currentLabel && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-brand-text-muted" />
            <span className="font-semibold text-brand-text">{currentLabel}</span>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Quick search shortcut → orders */}
        <Link
          href="/admin/orders"
          className="hidden items-center gap-2 rounded-lg border border-[#E7E5E4] bg-[#F5F6F7] px-3 py-1.5 text-xs text-brand-text-muted transition hover:border-brand-primary hover:text-brand-primary sm:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search orders…</span>
        </Link>

        {/* Bell — links to proofs queue */}
        <Link
          href="/admin/proofs"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-brand-text-muted transition hover:bg-[#F5F6F7] hover:text-brand-text"
          title="Pending proofs"
        >
          <Bell className="h-4 w-4" />
        </Link>

        {/* User badge */}
        <div className="hidden items-center gap-2 rounded-lg border border-[#E7E5E4] py-1 pl-2 pr-3 sm:flex">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white shadow-sm"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-brand-text leading-tight max-w-[120px]">
              {user?.full_name ?? 'Admin'}
            </p>
            <p className="text-[10px] font-medium text-brand-text-muted">
              {user?.role === 'production_staff' ? 'Production Staff' : 'Admin'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  // Wait for Zustand persist to rehydrate from localStorage before checking auth
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    // Wait for async refreshProfile() to finish before deciding to redirect.
    // Without this check, the layout redirects to /login immediately after hydration
    // because isAuthenticated is still false while the profile fetch is in flight.
    if (isLoading) return
    // Not logged in at all — send to login with redirect param
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
    }
    // Note: wrong-role case is handled inline below (no silent redirect to /)
  }, [hydrated, isAuthenticated, isLoading, router])

  // ── Loading state during Zustand rehydration or profile fetch ─────────────
  if (!hydrated || isLoading) {
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark sm:w-auto"
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
    <div className="flex h-screen overflow-hidden bg-[#F5F6F7]">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopBar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
