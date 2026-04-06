'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  Menu,
  X,
  ChevronLeft,
  PenSquare,
  MessageSquareQuote,
  Palette,
  TableProperties,
  ShieldCheck,
  Printer,
  LogOut,
  Inbox,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SITE_NAME } from '@/lib/utils/constants'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

/* ── Nav sections ── */
const OPERATIONS_NAV = [
  { href: '/admin',            label: 'Dashboard',   icon: LayoutDashboard,   staffAllowed: true,  badgeKey: ''         },
  { href: '/admin/orders',     label: 'Orders',      icon: ShoppingCart,      staffAllowed: true,  badgeKey: 'orders'   },
  { href: '/admin/proofs',     label: 'Proofs',      icon: ShieldCheck,       staffAllowed: true,  badgeKey: 'proofs'   },
  { href: '/admin/production', label: 'Production',  icon: Printer,           staffAllowed: true,  badgeKey: ''         },
  { href: '/admin/csv',        label: 'CSV Jobs',    icon: TableProperties,   staffAllowed: true,  badgeKey: 'csv'      },
]

const CATALOG_NAV = [
  { href: '/admin/products',  label: 'Products',  icon: Package,  staffAllowed: false, badgeKey: '' },
  { href: '/admin/templates', label: 'Templates', icon: FileText, staffAllowed: false, badgeKey: '' },
  { href: '/admin/designs',   label: 'Designs',   icon: Palette,  staffAllowed: false, badgeKey: '' },
]

const CONTENT_NAV = [
  { href: '/admin/blog',         label: 'Blog',         icon: PenSquare,        staffAllowed: false, badgeKey: '' },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote, staffAllowed: false, badgeKey: '' },
]

const ADMIN_NAV = [
  { href: '/admin/enquiries', label: 'Enquiries', icon: Inbox,    staffAllowed: false, badgeKey: 'enquiries' },
  { href: '/admin/users',     label: 'Users',     icon: Users,    staffAllowed: false, badgeKey: '' },
  { href: '/admin/settings',  label: 'Settings',  icon: Settings, staffAllowed: false, badgeKey: '' },
]

interface Badges {
  orders: number
  proofs: number
  csv: number
  enquiries: number
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [badges, setBadges] = useState<Badges>({ orders: 0, proofs: 0, csv: 0, enquiries: 0 })

  const isProductionStaff = user?.role === 'production_staff'

  /* Fetch attention counts for badges */
  useEffect(() => {
    async function fetchBadges() {
      try {
        const [dashRes, enquiriesRes] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/admin/enquiries?status=unread'),
        ])
        const dash = dashRes.ok ? await dashRes.json() : {}
        const enq  = enquiriesRes.ok ? await enquiriesRes.json() : {}
        setBadges({
          orders:    dash.stats?.newOrders ?? 0,
          proofs:    dash.stats?.pendingProofs ?? 0,
          csv:       dash.stats?.processingCsv ?? 0,
          enquiries: enq.unreadCount ?? 0,
        })
      } catch {
        // silently ignore
      }
    }
    if (user?.role === 'admin' || user?.role === 'production_staff') {
      fetchBadges()
    }
  }, [user])

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const initials =
    user?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?'

  /* ── Reusable nav link ── */
  function NavLink({
    href,
    label,
    icon: Icon,
    badge,
  }: {
    href: string
    label: string
    icon: React.ElementType
    badge?: number
  }) {
    const active = isActive(href)
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        title={collapsed ? label : undefined}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
          collapsed && 'justify-center px-2',
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
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            {badge && badge > 0 ? (
              <span
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                style={{
                  background: active ? 'rgba(255,255,255,0.25)' : '#E30613',
                  color: '#fff',
                }}
              >
                {badge > 9 ? '9+' : badge}
              </span>
            ) : active ? (
              <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
            ) : null}
          </>
        )}
        {collapsed && badge && badge > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-primary text-[9px] font-bold text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
      </Link>
    )
  }

  /* ── Section label ── */
  function SectionLabel({ label }: { label: string }) {
    if (collapsed) return <div className="my-2 border-t border-white/10" />
    return (
      <p className="mb-1 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/25 first:mt-2">
        {label}
      </p>
    )
  }

  /* ── Filter nav by role ── */
  function filterByRole<T extends { staffAllowed: boolean }>(items: T[]) {
    return isProductionStaff ? items.filter((i) => i.staffAllowed) : items
  }

  const navContent = (
    <nav className="flex flex-col px-3 py-2">
      {/* Operations */}
      {filterByRole(OPERATIONS_NAV).length > 0 && (
        <>
          <SectionLabel label="Operations" />
          <div className="flex flex-col gap-0.5">
            {filterByRole(OPERATIONS_NAV).map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                badge={item.badgeKey ? badges[item.badgeKey as keyof Badges] : undefined}
              />
            ))}
          </div>
        </>
      )}

      {/* Catalog — admin only */}
      {!isProductionStaff && (
        <>
          <SectionLabel label="Catalog" />
          <div className="flex flex-col gap-0.5">
            {CATALOG_NAV.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </div>
        </>
      )}

      {/* Content — admin only */}
      {!isProductionStaff && (
        <>
          <SectionLabel label="Content" />
          <div className="flex flex-col gap-0.5">
            {CONTENT_NAV.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </div>
        </>
      )}

      {/* Admin — admin only */}
      {!isProductionStaff && (
        <>
          <SectionLabel label="Admin" />
          <div className="flex flex-col gap-0.5">
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </div>
        </>
      )}
    </nav>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        aria-label="Toggle admin menu"
        className="fixed left-4 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-secondary lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen
          ? <X    className="h-4 w-4 text-white" />
          : <Menu className="h-4 w-4 text-white" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col bg-brand-secondary transition-all duration-300 lg:relative lg:z-auto',
          collapsed ? 'w-[72px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary">
                <Printer className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white leading-tight">{SITE_NAME}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Admin</p>
              </div>
            </Link>
          )}
          <button
            className="hidden shrink-0 h-8 w-8 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/[0.07] hover:text-white lg:flex"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
            />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">{navContent}</div>

        {/* Footer */}
        <div className="border-t border-white/10 p-3 space-y-0.5">
          {/* User card */}
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: 'rgba(227,6,19,0.4)' }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-white">
                  {user?.full_name ?? 'Admin'}
                </p>
                <p className="truncate text-[11px] text-white/40">{user?.email}</p>
              </div>
            </div>
          )}

          <Link
            href="/"
            title={collapsed ? 'Back to site' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-all hover:bg-white/[0.07] hover:text-white/80',
              collapsed && 'justify-center'
            )}
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Back to Site</span>}
          </Link>

          <button
            onClick={async () => { await logout(); router.push('/login') }}
            title={collapsed ? 'Sign out' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-white/[0.07] hover:text-red-300',
              collapsed && 'justify-center'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
