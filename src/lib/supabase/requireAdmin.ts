import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type RequireAdminResult =
  | { error: string; status: 401 | 403; user: null; profile: null }
  | { error: null; status: 200; user: NonNullable<unknown>; profile: { role: string } }

export async function requireAdmin(
  allowedRoles: string[] = ['admin', 'production_staff']
): Promise<RequireAdminResult> {
  // Fail closed: if Supabase is not configured, deny all access
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { error: 'Unauthorized', status: 401, user: null, profile: null }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', status: 401, user: null, profile: null }
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !allowedRoles.includes(profile.role)) {
    return { error: 'Forbidden', status: 403, user: null, profile: null }
  }

  return { error: null, status: 200, user, profile }
}
