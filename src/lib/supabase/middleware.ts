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

  // Protect /account and /checkout routes
  if (pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // BUG-025 FIX: Admin / staff have their own panel — send them there
    // Extract role from JWT app_metadata (synced via trigger) instead of DB query
    const role = user.app_metadata?.role

    if (role && ['admin', 'production_staff'].includes(role) && pathname.startsWith('/account')) {
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

  // BUG-026 FIX: Generate nonce for Content-Security-Policy
  // Generate a random 16-byte nonce and convert to base64
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // pathname is already defined at the top

  // Redirect logged-in users away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/account'
    return NextResponse.redirect(url)
  }

  // BUG-026 FIX: Apply dynamic Content-Security-Policy
  // We use the nonce to allow specific inline scripts and styles while blocking others.
  // Note: we still keep 'unsafe-eval' for Fabric.js for now, but remove 'unsafe-inline' where possible.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https: http:;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob: https://atqjywawohnhvlnggozu.supabase.co;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com;
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
    frame-ancestors 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim()

  // Set headers on the response
  supabaseResponse.headers.set('Content-Security-Policy', cspHeader)
  supabaseResponse.headers.set('x-nonce', nonce)

  return supabaseResponse
}
