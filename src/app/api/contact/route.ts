import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendContactFormEmail } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Save to database
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        status: 'unread',
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('[Contact] DB insert error:', dbError)
      return NextResponse.json({ error: 'Failed to save enquiry.' }, { status: 500 })
    }

    // Send notification email to admin (non-blocking — don't fail the request if email fails)
    sendContactFormEmail(name.trim(), email.trim(), subject.trim(), message.trim()).catch(
      (err) => console.error('[Contact] Admin notification email error:', err)
    )

    return NextResponse.json({ id: submission.id }, { status: 201 })
  } catch (err) {
    console.error('[Contact] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
