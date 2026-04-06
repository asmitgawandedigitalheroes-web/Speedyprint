import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'
import { sendEnquiryReply } from '@/lib/email/resend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, status: authStatus } = await requireAdmin()
  if (authError) return NextResponse.json({ error: authError }, { status: authStatus })

  try {
    const { id } = await params
    const { replyMessage, repliedBy } = await request.json()

    if (!replyMessage?.trim()) {
      return NextResponse.json({ error: 'Reply message is required.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch the original submission
    const { data: submission, error: fetchError } = await supabase
      .from('contact_submissions')
      .select('id, name, email, subject, status')
      .eq('id', id)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 })
    }

    if (submission.status === 'replied') {
      return NextResponse.json({ error: 'This enquiry has already been replied to.' }, { status: 409 })
    }

    // Send reply email to the customer
    const emailResult = await sendEnquiryReply(
      submission.name,
      submission.email,
      submission.subject,
      replyMessage.trim()
    )

    if (emailResult.error) {
      console.error('[EnquiryReply] Resend error:', emailResult.error)
      return NextResponse.json({ error: 'Failed to send reply email.' }, { status: 502 })
    }

    // Mark as replied in the database
    const { error: updateError } = await supabase
      .from('contact_submissions')
      .update({
        status: 'replied',
        reply_message: replyMessage.trim(),
        replied_at: new Date().toISOString(),
        replied_by: repliedBy ?? null,
      })
      .eq('id', id)

    if (updateError) {
      console.error('[EnquiryReply] DB update error:', updateError)
      // Email already sent — log but don't fail the response
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[EnquiryReply] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
