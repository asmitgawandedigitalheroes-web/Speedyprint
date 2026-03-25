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
import { SITE_NAME, WHATSAPP_URL } from '@/lib/utils/constants'

interface NavItem {
  href: string
  label: string
  children?: { href: string; label: string }[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '#',
    label: 'About Us',
    children: [
      { href: '/our-story', label: 'Our Story' },
      { href: '/why-choose-us', label: 'Why Choose Us' },
      { href: '/testimonials', label: 'Testimonials' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  { href: '/products', label: 'Products' },
  { href: '/templates', label: 'Templates' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
  { href: '/order-now', label: 'Order Now' },
]

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
        <div className="absolute left-0 top-full z-50 min-w-[180px] rounded-md border bg-white py-1 shadow-lg">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => setOpen(false)}
              className={cn(
                'block px-4 py-2 text-sm transition-colors',
                pathname.startsWith(child.href)
                  ? 'bg-brand-primary/5 text-brand-primary'
                  : 'text-brand-text hover:bg-gray-50 hover:text-brand-primary'
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const itemCount = useCart((s) => s.getItemCount())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/images/logo.png"
            alt={SITE_NAME}
            width={160}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <DesktopDropdown key={item.label} item={item} />
            ) : item.href === '/order-now' ? (
              <Link
                key={item.href}
                href={item.href}
                className="ml-1 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'text-brand-primary'
                    : 'text-brand-text hover:text-brand-primary'
                )}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Right Side: Search + WhatsApp + Cart + Auth */}
        <div className="flex items-center gap-1.5">
          {/* Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(!searchOpen)}
            className="hidden sm:flex"
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* WhatsApp */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-[#25D366] hover:text-[#25D366]"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">WhatsApp</span>
            </Button>
          </a>

          {/* Cart */}
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary p-0 text-[10px] text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </Badge>
              )}
              <span className="sr-only">Cart</span>
            </Button>
          </Link>

          {/* Auth Section */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">
                    {user.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.role !== 'customer' && (
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {user.role === 'admin' ? 'Admin' : 'Staff'}
                    </Badge>
                  )}
                </div>
                <DropdownMenuSeparator />
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
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-brand-primary text-white hover:bg-brand-primary-dark"
                >
                  Register
                </Button>
              </Link>
            </div>
          )}

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
                    <div key={item.label}>
                      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
                        {item.label}
                      </p>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'block rounded-md px-6 py-2 text-sm font-medium transition-colors',
                            isActive(child.href)
                              ? 'bg-brand-primary/10 text-brand-primary'
                              : 'text-brand-text hover:bg-gray-100 hover:text-brand-primary'
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-brand-primary/10 text-brand-primary'
                          : 'text-brand-text hover:bg-gray-100 hover:text-brand-primary'
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                )}

                <div className="my-4 h-px bg-gray-200" />

                {isAuthenticated && user ? (
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
