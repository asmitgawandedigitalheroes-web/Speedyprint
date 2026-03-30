'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserSidebar } from '@/components/layout/UserSidebar'
import { useAuth } from '@/hooks/useAuth'
import { Bell, ChevronRight } from 'lucide-react'

/* ── Breadcrumb map ── */
const ROUTE_LABELS: Record<string, string> = {
  '/account':         'Dashboard',
  '/account/orders':  'My Orders',
  '/account/proofs':  'Proofs',
  '/account/designs': 'Saved Designs',
  '/account/profile': 'Profile Settings',
}

function TopBar() {
  const { user }   = useAuth()
  const pathname   = usePathname()

  /* Build simple breadcrumb: Account › Page */
  const currentLabel = pathname === '/account'
    ? 'Dashboard'
    : Object.entries(ROUTE_LABELS)
        .filter(([route]) => route !== '/account')
        .find(([route]) => pathname.startsWith(route))?.[1]

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[#E7E5E4] bg-white px-6 shadow-sm">
      {/* Breadcrumb — pl-14 on mobile so hamburger button doesn't overlap */}
      <div className="flex items-center gap-1.5 pl-14 text-sm lg:pl-0">
        <span className="font-medium text-brand-text-muted">Account</span>
        {currentLabel && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-brand-text-muted" />
            <span className="font-semibold text-brand-text">{currentLabel}</span>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell (visual only) */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-full text-brand-text-muted transition hover:bg-[#F5F6F7] hover:text-brand-text">
          <Bell className="h-4 w-4" />
        </button>

        {/* Avatar */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: '#E30613' }}
          title={user?.full_name ?? ''}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    // Admin / production staff belong in the admin panel
    if (user?.role === 'admin' || user?.role === 'production_staff') {
      router.replace('/admin')
    }
  }, [hydrated, isAuthenticated, user, router])

  /* Show spinner while hydrating or redirecting */
  if (!hydrated || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-secondary">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    )
  }

  /* Also block render while admin redirect fires */
  if (user?.role === 'admin' || user?.role === 'production_staff') {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-secondary">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    )
  }

  return (
    /* Full-screen dashboard — no site header or footer */
    <div className="flex h-screen overflow-hidden bg-brand-secondary">
      {/* ── Left sidebar ── */}
      <UserSidebar />

      {/* ── Right: top-bar + scrollable content ── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#F5F6F7]">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
