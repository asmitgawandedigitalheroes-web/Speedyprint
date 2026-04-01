import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit } from '../rateLimit'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // @ts-ignore - request.ip exists on Vercel/Next.js but might not be in the type definition depending on version
  const ip = request.ip ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1'

  // BUG-013/028 FIX: Rate limit auth pages to prevent brute-force and DDoS
  if (pathname === '/login' || pathname === '/register' || pathname === '/reset-password') {
    const isAllowed = await rateLimit(`auth_page:${ip}`, 30, 60 * 1000) // 30 per minute
    if (!isAllowed) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  // Guard: if Supabase env vars are missing, skip auth checks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // pathname is already defined at the top

  // Protect /account routes
  if (pathname.startsWith('/account')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // BUG-025 FIX: Admin / staff have their own panel — send them there
    // Extract role from JWT app_metadata (synced via trigger) instead of DB query
    const role = user.app_metadata?.role

    if (role && ['admin', 'production_staff'].includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // BUG-025 FIX: Check role from JWT app_metadata
    const role = user.app_metadata?.role

    if (!role || !['admin', 'production_staff'].includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/forbidden'
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }

    // Production staff: restrict to production-related routes only
    const PRODUCTION_STAFF_ALLOWED = [
      '/admin/orders',
      '/admin/production',
      '/admin/proofs',
      '/admin/csv',
    ]

    if (role === 'production_staff') {
      // Allow exact-match OR sub-path match for each allowed route
      // Also allow the /admin dashboard index page itself (exact match)
      const allowed =
        pathname === '/admin' ||
        PRODUCTION_STAFF_ALLOWED.some(
          (allowed) => pathname === allowed || pathname.startsWith(allowed + '/')
        )
      if (!allowed) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/production'
        return NextResponse.redirect(url)
      }
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/account'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
