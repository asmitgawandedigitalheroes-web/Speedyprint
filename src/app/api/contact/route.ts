import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendContactFormEmail } from '@/lib/email/resend'
import { rateLimit } from '@/lib/rateLimit'
import { isValidOrigin } from '@/lib/utils/sanitize'
import { SITE_URL } from '@/lib/utils/constants'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 5 submissions per IP per 15 minutes
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? '127.0.0.1'
    if (!(await rateLimit(`contact:${ip}`, 5, 15 * 60 * 1000))) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    // CSRF: reject requests from other origins
    const origin = request.headers.get('origin')
    if (origin && !isValidOrigin(origin, SITE_URL)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, email, subject, message, artwork_url } = await request.json()

    // Field length limits
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Append artwork URL to message body so it's persisted in DB regardless of schema
    const fullMessage = artwork_url
      ? `${message.trim()}\n\nArtwork File: ${artwork_url}`
      : message.trim()

    // Save to database
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: fullMessage,
        status: 'unread',
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('[Contact] DB insert error:', dbError)
      return NextResponse.json({ error: 'Failed to save enquiry.' }, { status: 500 })
    }

    // Send notification email to admin (non-blocking — don't fail the request if email fails)
    sendContactFormEmail(name.trim(), email.trim(), subject.trim(), message.trim(), artwork_url || undefined).catch(
      (err) => console.error('[Contact] Admin notification email error:', err)
    )

    return NextResponse.json({ id: submission.id }, { status: 201 })
  } catch (err) {
    console.error('[Contact] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
