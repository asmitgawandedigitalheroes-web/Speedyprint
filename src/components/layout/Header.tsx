'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  ShoppingCart,
  Menu,
  User,
  LogOut,
  LayoutDashboard,
  Palette,
  UserCircle,
  ChevronDown,
  Search,
  Package,
  MessageCircle,
  X,
  Tag,
  Hash,
  Zap,
  Layout,
  Stamp,
  ArrowRight,
  Sparkles,
  Bike,
  Trophy,
  Printer,
  Info,
  Phone,
  Briefcase,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { cn } from '@/lib/utils'
import { SITE_NAME, WHATSAPP_URL, PRODUCT_FAMILIES, HEADER_PRODUCTS } from '@/lib/utils/constants'
import { formatTimeAgo } from '@/lib/utils/format'

interface NavItem {
  href: string
  label: string
  children?: { href: string; label: string; description?: string; icon?: string }[]
  isPrimary?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/products',
    label: 'Products',
    children: HEADER_PRODUCTS
  },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#bulk-orders', label: 'Bulk Orders' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

const ICON_MAP: Record<string, any> = {
  Tag,
  Hash,
  Zap,
  Layout,
  Stamp,
  Bike,
  Trophy,
  Printer,
  Info,
  Phone,
  Briefcase,
}

function DesktopDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  const isChildActive = item.children?.some((child) =>
    pathname.startsWith(child.href)
  )

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={cn(
          'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isChildActive
            ? 'text-brand-primary'
            : 'text-brand-text hover:text-brand-primary'
        )}
      >
        {item.label}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 rounded-xl border bg-white p-2 shadow-xl ring-1 ring-black/5 min-w-[200px]">
          <div className="flex flex-col py-1">
            {item.children?.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-4 py-2 text-sm transition-all duration-200 rounded-md mx-1',
                  pathname === child.href
                    ? 'bg-brand-primary/5 text-brand-primary font-medium'
                    : 'text-brand-text hover:bg-gray-50 hover:text-brand-primary'
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const storeItemCount = useCart((s) => s.getItemCount())
  const [itemCount, setItemCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
          // For now, let's say all new logs are "unread" if they are less than 24h old
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          const count = (data.notifications || []).filter((n: any) => new Date(n.created_at) > oneDayAgo).length
          setUnreadCount(count)
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      }
    }

    fetchNotifications()
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Sync cart count client-side only to avoid hydration mismatch
  // (Zustand store is populated from localStorage after hydration)
  useEffect(() => {
    setItemCount(storeItemCount)
  }, [storeItemCount])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setMobileOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-3 group">
            <div className="relative">
              <Image
                src="/images/logo.png"
                alt={SITE_NAME}
                width={264}
                height={56}
                className="h-12 w-auto transition-transform duration-200 group-hover:scale-[1.02]"
                style={{ width: 'auto' }}
                sizes="(max-width: 768px) 200px, 264px"
                priority
              />
            </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <DesktopDropdown key={item.label} item={item} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'text-brand-primary underline decoration-2 underline-offset-8'
                    : 'text-brand-text hover:text-brand-primary'
                )}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Right Side: CTAs + Utilities */}
        <div className="flex items-center gap-3">
          {!isAuthenticated && (
            <>
              {/* Secondary CTA: Try Designer Tool (Outline) */}
              <Link href="/templates" className="hidden md:block">
                <Button variant="outline" size="sm" className="h-10 border-gray-200 px-5 text-sm font-semibold hover:border-brand-primary hover:text-brand-primary">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Try Design
                </Button>
              </Link>

              {/* Primary CTA: Get Instant Quote (Solid) — hidden on mobile, shown md+ */}
              <Link href="/order-now" className="hidden md:block">
                <Button
                  size="sm"
                  className="h-10 bg-brand-primary px-6 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-primary-dark hover:shadow-brand-primary/30"
                >
                  Get Instant Quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              {/* Vertical Separator */}
              <div className="hidden h-6 w-px bg-gray-200 sm:block mx-1" />
            </>
          )}

          {/* Utilities */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Search toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-10 w-10 lg:flex"
              onClick={() => setSearchOpen((o) => !o)}
              aria-label="Search products"
            >
              {searchOpen ? <X className="h-[1.125rem] w-[1.125rem]" /> : <Search className="h-[1.125rem] w-[1.125rem]" />}
            </Button>

            {/* Audit Log Notifications */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10"
                    aria-label="Notifications"
                  >
                    <Bell className="h-[1.125rem] w-[1.125rem]" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-primary px-1 text-[9px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 mt-2">
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <p className="text-sm font-bold">Activity Logs</p>
                    <Link href="/account" className="text-[11px] text-brand-primary hover:underline">
                      View Account
                    </Link>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center px-4">
                        <Bell className="mx-auto h-8 w-8 text-gray-200 mb-2" />
                        <p className="text-xs text-muted-foreground">No recent activity</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <DropdownMenuItem key={n.id} asChild>
                          <Link
                            href={`/account/orders/${n.order_id}`}
                            className="flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-gray-50 border-b last:border-0"
                          >
                            <div className="flex w-full items-start justify-between gap-2">
                              <span className="text-[13px] font-bold leading-tight text-brand-text">
                                {n.title}
                              </span>
                              <span className="shrink-0 text-[10px] text-muted-foreground">
                                {formatTimeAgo(n.created_at)}
                              </span>
                            </div>
                            <p className="text-[12px] text-brand-text-muted line-clamp-2">
                              {n.message}
                            </p>
                          </Link>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <ShoppingCart className="h-[1.125rem] w-[1.125rem]" />
                {itemCount > 0 && (
                  <Badge className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold text-white ring-2 ring-white" id="cart-badge">
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>

            {/* Auth/Account */}
            {isLoading ? (
              <div className="h-9 w-9 animate-pulse rounded-full bg-gray-50" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                    <UserCircle className="h-[1.125rem] w-[1.125rem]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold">{user.full_name || 'User'}</p>
                    <p className="text-xs text-brand-text-muted truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {(user.role === 'admin' || user.role === 'production_staff') ? (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/account" className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          Account Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/orders" className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          My Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/designs" className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          My Designs
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="flex items-center gap-2 text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="h-10 px-4 text-brand-text hover:text-brand-primary">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-left text-brand-primary">
                  {SITE_NAME}
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 rounded-md border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
                <Button type="submit" size="sm" className="bg-brand-primary text-white hover:bg-brand-primary-dark">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              <nav className="mt-6 flex flex-col gap-1">
                {NAV_ITEMS.map((item) =>
                  item.children ? (
                    <div key={item.label} className="mb-4">
                      <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">
                        {item.label}
                      </p>
                      <div className="space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              'block rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                              isActive(child.href)
                                ? 'bg-brand-primary/10 text-brand-primary'
                                : 'text-brand-text hover:bg-gray-100'
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'rounded-xl px-3 py-3 text-sm font-bold transition-colors',
                          isActive(item.href)
                            ? 'bg-brand-primary/10 text-brand-primary'
                            : 'text-brand-text hover:bg-gray-100'
                        )}
                      >
                        {item.label}
                      </Link>
                  )
                )}

                <div className="my-6 h-px bg-gray-100" />

                {!isAuthenticated && (
                  <div className="px-3 space-y-4 pt-2">
                    <Link href="/order-now" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full h-12 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-dark transition-all duration-200">
                        Get Instant Quote
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/templates" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full h-12 font-bold rounded-xl border-2 border-gray-100 hover:border-brand-primary hover:text-brand-primary transition-all duration-200">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Try Designer Tool
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="my-6 h-px bg-gray-100" />

                {/* Auth section if not logged in */}
                {isLoading ? (
                  <div className="mx-3 h-20 animate-pulse rounded-xl bg-gray-50" />
                ) : isAuthenticated && user ? (
                  <>
                    <div className="px-3 py-3 mb-2 bg-gray-50/50 rounded-xl mx-3">
                      <p className="text-sm font-bold text-brand-text">{user.full_name || 'User'}</p>
                      <p className="text-xs text-brand-text-muted truncate">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                      {(user.role === 'admin' || user.role === 'production_staff') ? (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-brand-text hover:bg-brand-primary/5 hover:text-brand-primary transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      ) : (
                        <>
                          <Link
                            href="/account"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-brand-text hover:bg-brand-primary/5 hover:text-brand-primary transition-colors"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                          </Link>
                          <Link
                            href="/account/orders"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-brand-text hover:bg-brand-primary/5 hover:text-brand-primary transition-colors"
                          >
                            <Package className="h-4 w-4" />
                            My Orders
                          </Link>
                          <Link
                            href="/account/designs"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-brand-text hover:bg-brand-primary/5 hover:text-brand-primary transition-colors"
                          >
                            <Palette className="h-4 w-4" />
                            My Designs
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => { logout(); setMobileOpen(false) }}
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 px-3">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full h-11 font-bold rounded-xl border-gray-100">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full h-11 bg-brand-primary text-white font-bold rounded-xl shadow-md shadow-brand-primary/10">
                        Register
                      </Button>
                    </Link>
                  </div>
                )}

                {/* WhatsApp in mobile */}
                <div className="my-6 h-px bg-gray-100" />
                <div className="px-3">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#25D366]/20 bg-[#25D366]/5 px-4 py-3 text-sm font-bold text-[#25D366] hover:bg-[#25D366]/10 transition-all duration-200"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Chat on WhatsApp
                  </a>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search Bar (toggled) */}
      {searchOpen && (
        <div className="border-t bg-white px-4 py-3">
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for stickers, labels, decals..."
                className="flex-1 rounded-md border px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                autoFocus
              />
              <Button
                type="submit"
                className="bg-brand-primary text-white hover:bg-brand-primary-dark"
              >
                Search
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
