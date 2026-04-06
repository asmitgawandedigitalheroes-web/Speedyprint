'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  ShieldCheck,
  Palette,
  User,
  Menu,
  X,
  LogOut,
  Printer,
  ArrowUpLeft,
  Plus,
  FileImage,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { SITE_NAME } from '@/lib/utils/constants'

export function UserSidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [proofCount, setProofCount] = useState(0)

  /* Fetch pending proof count for badge */
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    async function fetchProofCount() {
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user!.id)
      if (!orders?.length) return
      const { count } = await supabase
        .from('order_items')
        .select('id', { count: 'exact', head: true })
        .in('order_id', orders.map((o: { id: string }) => o.id))
        .eq('status', 'proof_sent')
      setProofCount(count ?? 0)
    }
    fetchProofCount()
  }, [user])

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?'

  const handleLogout = async () => {
    // BUG-015 FIX: Always redirect the user within 3 seconds even if signOut hangs.
    // The Supabase auth lock can deadlock if a non-singleton client is used (BUG-001).
    // Belt-and-suspenders: force-navigate after 3s so the user is never permanently trapped.
    const forceRedirect = setTimeout(() => {
      router.replace('/')
      router.refresh()
    }, 3000)

    try {
      await logout()
      clearTimeout(forceRedirect)
      router.replace('/')
      router.refresh()
    } catch {
      clearTimeout(forceRedirect)
      router.replace('/')
      router.refresh()
    }
  }

  /* ─── Reusable nav link ─── */
  function NavLink({
    href,
    label,
    icon: Icon,
    exact = false,
    badge,
  }: {
    href: string
    label: string
    icon: React.ElementType
    exact?: boolean
    badge?: number
  }) {
    const active = isActive(href, exact)
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
          active
            ? 'bg-brand-primary text-white shadow-sm'
            : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-colors',
            active ? 'text-white' : 'text-white/40 group-hover:text-white/70'
          )}
        />
        <span className="flex-1 truncate">{label}</span>
        {badge && badge > 0 ? (
          <span
            className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
            style={{ background: active ? 'rgba(255,255,255,0.25)' : '#E30613', color: '#fff' }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        ) : active ? (
          <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
        ) : null}
      </Link>
    )
  }

  /* ─── Section label ─── */
  function SectionLabel({ label }: { label: string }) {
    return (
      <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/25 first:mt-0">
        {label}
      </p>
    )
  }

  /* ─── Sidebar content (shared between desktop + mobile drawer) ─── */
  const SidebarContent = () => (
    <div className="flex h-full flex-col">

      {/* ── Logo / Brand ── */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary shadow-sm">
          <Printer className="h-[18px] w-[18px] text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-sm font-bold leading-tight text-white truncate">
            {SITE_NAME}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            My Account
          </p>
        </div>
      </div>

      {/* ── New Order CTA ── */}
      <div className="px-3 pt-4">
        <Link
          href="/order-now"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 rounded-lg bg-brand-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4 shrink-0" />
          New Order
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-5">
        <SectionLabel label="Orders" />
        <div className="flex flex-col gap-0.5">
          <NavLink href="/account" label="Dashboard" icon={LayoutDashboard} exact />
          <NavLink href="/account/orders" label="My Orders" icon={ShoppingBag} />
          <NavLink href="/account/proofs" label="Proof Approvals" icon={ShieldCheck} badge={proofCount} />
        </div>

        <SectionLabel label="Designs" />
        <div className="flex flex-col gap-0.5">
          <NavLink href="/account/designs" label="Saved Designs" icon={Palette} />
          <NavLink href="/templates" label="Browse Templates" icon={FileImage} />
        </div>

        <SectionLabel label="Account" />
        <div className="flex flex-col gap-0.5">
          <NavLink href="/account/profile" label="Profile Settings" icon={User} />
        </div>
      </nav>

      {/* ── Bottom: user info + actions ── */}
      <div className="border-t border-white/10 p-3">

        {/* User card */}
        <div className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: 'rgba(227,6,19,0.4)' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-white">
              {user?.full_name || 'My Account'}
            </p>
            <p className="truncate text-[11px] text-white/40">{user?.email}</p>
          </div>
        </div>

        {/* Back to store */}
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-all hover:bg-white/[0.07] hover:text-white/80"
        >
          <ArrowUpLeft className="h-4 w-4 shrink-0" />
          Back to Store
        </Link>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-all hover:bg-white/[0.07] hover:text-white/80"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ─── Mobile hamburger ─── */}
      <button
        aria-label="Open menu"
        className="fixed left-4 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-lg lg:hidden"
        style={{ background: '#1E293B' }}
        onClick={() => setMobileOpen((o) => !o)}
      >
        {mobileOpen
          ? <X    className="h-4 w-4 text-white" />
          : <Menu className="h-4 w-4 text-white" />}
      </button>

      {/* ─── Mobile backdrop ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Desktop sidebar (always visible, full height via flex parent) ─── */}
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-secondary lg:flex">
        <SidebarContent />
      </aside>

      {/* ─── Mobile drawer ─── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex-col bg-brand-secondary shadow-2xl transition-transform duration-300 lg:hidden',
          mobileOpen ? 'flex translate-x-0' : 'flex -translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
