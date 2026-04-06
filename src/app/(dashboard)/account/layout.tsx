'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserSidebar } from '@/components/layout/UserSidebar'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Bell, ChevronRight, ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import type { Order } from '@/types'

/* ── Breadcrumb map ── */
const ROUTE_LABELS: Record<string, string> = {
  '/account':         'Dashboard',
  '/account/orders':  'My Orders',
  '/account/proofs':  'Proof Approvals',
  '/account/designs': 'Saved Designs',
  '/account/profile': 'Profile Settings',
}

function TopBar() {
  const { user }   = useAuth()
  const pathname   = usePathname()
  const [proofCount, setProofCount] = useState(0)
  const storeItemCount = useCart((s) => s.getItemCount())
  const [cartCount, setCartCount] = useState(0)

  /* Sync cart count client-side to avoid hydration mismatch */
  useEffect(() => {
    setCartCount(storeItemCount)
  }, [storeItemCount])

  /* Fetch pending proof count for bell badge */
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    async function fetchCount() {
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user!.id)
      
      const orderList = orders as Order[] | null
      if (!orderList?.length) return

      const { count } = await supabase
        .from('order_items')
        .select('id', { count: 'exact', head: true })
        .in('order_id', orderList.map((o: Order) => o.id))
        .eq('status', 'proof_sent')
      setProofCount(count ?? 0)
    }
    fetchCount()
  }, [user])

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
        {/* Notification bell — links to proofs when there are pending items */}
        <Link
          href="/account/proofs"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-brand-text-muted transition hover:bg-[#F5F6F7] hover:text-brand-text"
          title={proofCount > 0 ? `${proofCount} proof${proofCount > 1 ? 's' : ''} awaiting approval` : 'Notifications'}
        >
          <Bell className="h-4 w-4" />
          {proofCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-primary px-0.5 text-[10px] font-bold text-white">
              {proofCount > 9 ? '9+' : proofCount}
            </span>
          )}
        </Link>
        
        {/* Cart Icon */}
        <Link
          href="/cart"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-brand-text-muted transition hover:bg-[#F5F6F7] hover:text-brand-text"
          title="View Cart"
        >
          <ShoppingCart className="h-4 w-4" />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-primary px-0.5 text-[10px] font-bold text-white ring-2 ring-white">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link
          href="/account/profile"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition hover:opacity-80"
          style={{ background: '#E30613' }}
          title={user?.full_name ?? 'Profile'}
        >
          {initials}
        </Link>
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
