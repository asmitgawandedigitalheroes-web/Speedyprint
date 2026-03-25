'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SITE_NAME } from '@/lib/utils/constants'
import { useAuth } from '@/hooks/useAuth'

const ALL_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, staffAllowed: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, staffAllowed: true },
  { href: '/admin/products', label: 'Products', icon: Package, staffAllowed: false },
  { href: '/admin/templates', label: 'Templates', icon: FileText, staffAllowed: false },
  { href: '/admin/designs', label: 'Designs', icon: Palette, staffAllowed: false },
  { href: '/admin/csv', label: 'CSV Jobs', icon: TableProperties, staffAllowed: true },
  { href: '/admin/proofs', label: 'Proofs', icon: ShieldCheck, staffAllowed: true },
  { href: '/admin/production', label: 'Production', icon: Printer, staffAllowed: true },
  { href: '/admin/blog', label: 'Blog', icon: PenSquare, staffAllowed: false },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote, staffAllowed: false },
  { href: '/admin/users', label: 'Users', icon: Users, staffAllowed: false },
  { href: '/admin/settings', label: 'Settings', icon: Settings, staffAllowed: false },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isProductionStaff = user?.role === 'production_staff'
  const ADMIN_NAV = isProductionStaff
    ? ALL_NAV.filter((item) => item.staffAllowed)
    : ALL_NAV

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const navContent = (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {ADMIN_NAV.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'bg-brand-primary text-white'
                : 'text-brand-text-muted hover:bg-brand-bg hover:text-brand-primary'
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">Toggle admin menu</span>
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 lg:relative lg:z-auto',
          collapsed ? 'w-[72px]' : 'w-64',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          {!collapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-lg font-bold text-brand-primary">
                {SITE_NAME}
              </span>
              <span className="text-xs font-medium text-gray-500">Admin</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden shrink-0 lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform',
                collapsed && 'rotate-180'
              )}
            />
            <span className="sr-only">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">{navContent}</div>

        {/* Back to Site Link */}
        <div className="border-t border-gray-200 px-3 py-4">
          <Link
            href="/"
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-brand-text-muted transition-colors hover:bg-brand-bg hover:text-brand-primary',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Back to site' : undefined}
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>
    </>
  )
}
