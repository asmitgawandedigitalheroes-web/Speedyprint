import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/email/resend'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  // 5 reset attempts per IP per 15 minutes
  if (!rateLimit(`reset_password:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait before trying again.' }, { status: 429 })
  }

  let email: string
  try {
    const body = await request.json()
    email = body?.email
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const origin = new URL(request.url).origin

  try {
    const admin = createAdminClient()

    // Generate the reset link via Supabase Admin — this creates a valid one-time token
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${origin}/api/auth/callback?next=/reset-password%3Ftype%3Drecovery`,
      },
    })

    if (error) {
      // Don't expose whether the email exists — always return success to prevent enumeration
      console.error('[ResetPassword] generateLink error:', error.message)
      return NextResponse.json({ success: true })
    }

    // Send via Resend using the generated action link
    const resetLink = data.properties.action_link
    await sendPasswordResetEmail(email, resetLink)
  } catch (err) {
    console.error('[ResetPassword] Unexpected error:', err)
    // Still return success to avoid leaking info
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: true })
}
