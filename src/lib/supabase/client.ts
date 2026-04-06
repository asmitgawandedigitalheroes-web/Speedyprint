import { createBrowserClient } from '@supabase/ssr'

// BUG-001 FIX: Use a module-level singleton so the same client instance is reused
// across all renders and navigations. Creating a new client on every call orphans the
// Supabase auth-js browser lock, causing "Failed to fetch" errors and session drops
// when Next.js App Router unmounts/remounts components during route transitions.
let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (_client) return _client
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return _client
}
