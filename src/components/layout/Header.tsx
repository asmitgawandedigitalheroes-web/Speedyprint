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
import { SITE_NAME, WHATSAPP_URL, PRODUCT_FAMILIES } from '@/lib/utils/constants'

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
    children: PRODUCT_FAMILIES.map(family => ({
      href: `/products?division=${family.divisionKey}`,
      label: family.name,
      description: family.description,
      icon: family.icon
    }))
  },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#bulk-orders', label: 'Bulk Orders' },
  {
    href: '/our-story',
    label: 'About Us',
    children: [
      { href: '/our-story', label: 'Our Story' },
      { href: '/why-choose-us', label: 'Why Choose Us' },
      { href: '/testimonials', label: 'Testimonials' },
      { href: '/blog', label: 'Blog' },
    ],
  },
]

const ICON_MAP: Record<string, any> = {
  Tag,
  Hash,
  Zap,
  Layout,
  Stamp,
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
        <div className={cn(
          "absolute left-1/2 top-full z-50 -translate-x-1/2 rounded-xl border bg-white p-2 shadow-xl ring-1 ring-black/5 mt-1",
          item.label === 'Products' ? "w-[600px]" : "min-w-[200px]"
        )}>
          {item.label === 'Products' ? (
            <div className="grid grid-cols-2 gap-2">
              {item.children?.map((child) => {
                const IconComp = child.icon ? ICON_MAP[child.icon] : null
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-start gap-3 rounded-lg p-3 transition-all duration-200',
                      pathname === child.href
                        ? 'bg-brand-primary/5 text-brand-primary'
                        : 'text-brand-text hover:bg-gray-50 hover:text-brand-primary group'
                    )}
                  >
                    {IconComp && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 group-hover:bg-brand-primary/10 transition-colors">
                        <IconComp className="h-4 w-4 text-brand-text-muted group-hover:text-brand-primary" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold">{child.label}</p>
                      {child.description && (
                        <p className="mt-0.5 text-xs text-brand-text-muted line-clamp-1">{child.description}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
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
          )}
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
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/images/logo.png"
              alt={SITE_NAME}
              width={264}
              height={56}
              className="h-14 w-auto"
              style={{ width: 'auto' }}
              priority
            />
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
          {/* Secondary CTA: Try Designer Tool (Outline) */}
          <Link href="/templates" className="hidden xl:block">
            <Button variant="outline" size="sm" className="h-10 border-gray-200 px-5 text-sm font-semibold hover:border-brand-primary hover:text-brand-primary">
              <Sparkles className="mr-2 h-4 w-4" />
              Try Designer Tool
            </Button>
          </Link>

          {/* Primary CTA: Get Instant Quote (Solid) */}
          <Link href="/order-now">
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

          {/* Utilities */}
          <div className="flex items-center gap-0.5">
            {/* Search - Hidden for now */}
            {/* 
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden h-10 w-10 sm:flex"
            >
              <Search className="h-[1.125rem] w-[1.125rem]" />
              <span className="sr-only">Search</span>
            </Button>
            */}

            {/* Cart - Hidden for now */}
            {/* 
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <ShoppingCart className="h-[1.125rem] w-[1.125rem]" />
                {itemCount > 0 && (
                  <Badge className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary p-0 text-[9px] text-white ring-2 ring-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
            */}

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
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Account Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/account/orders"
                      className="flex items-center gap-2"
                    >
                      <Package className="h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/account/designs"
                      className="flex items-center gap-2"
                    >
                      <Palette className="h-4 w-4" />
                      My Designs
                    </Link>
                  </DropdownMenuItem>
                  {(user.role === 'admin' || user.role === 'production_staff') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Dashboard
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
                        {item.children.map((child) => {
                          const IconComp = child.icon ? ICON_MAP[child.icon] : null
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                                isActive(child.href)
                                  ? 'bg-brand-primary/10 text-brand-primary'
                                  : 'text-brand-text hover:bg-gray-100'
                              )}
                            >
                              {IconComp && (
                                <div className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100",
                                  isActive(child.href) && "bg-brand-primary/20"
                                )}>
                                  <IconComp className={cn("h-4 w-4", isActive(child.href) ? "text-brand-primary" : "text-brand-text-muted")} />
                                </div>
                              )}
                              <div>
                                <p className="leading-none">{child.label}</p>
                                {item.label === 'Products' && child.description && (
                                  <p className="mt-1 text-[10px] text-brand-text-muted font-normal line-clamp-1">{child.description}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
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

                <div className="px-3 space-y-3">
                  <Link href="/order-now" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full h-12 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20">
                      Get Instant Quote
                    </Button>
                  </Link>
                  <Link href="/templates" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full h-12 font-bold rounded-xl border-gray-200">
                      Try Designer Tool
                    </Button>
                  </Link>
                </div>

                <div className="my-6 h-px bg-gray-100" />

                {isLoading ? (
                  <div className="mx-3 h-20 animate-pulse rounded-md bg-gray-50" />
                ) : isAuthenticated && user ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">
                        {user.full_name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-text hover:bg-gray-100"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-text hover:bg-gray-100"
                    >
                      <UserCircle className="h-4 w-4" />
                      My Account
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-text hover:bg-gray-100"
                    >
                      <Package className="h-4 w-4" />
                      My Orders
                    </Link>
                    <Link
                      href="/account/designs"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-text hover:bg-gray-100"
                    >
                      <Palette className="h-4 w-4" />
                      My Designs
                    </Link>
                    {(user.role === 'admin' ||
                      user.role === 'production_staff') && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-text hover:bg-gray-100"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      )}
                    <button
                      onClick={() => {
                        logout()
                        setMobileOpen(false)
                      }}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-3">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full bg-brand-primary text-white hover:bg-brand-primary-dark">
                        Register
                      </Button>
                    </Link>
                  </div>
                )}

                {/* WhatsApp in mobile */}
                <div className="my-4 h-px bg-gray-200" />
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#25D366] hover:bg-green-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
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
