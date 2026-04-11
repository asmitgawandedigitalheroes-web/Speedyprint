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

    // Save reply to DB first so it's never lost
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
      return NextResponse.json({ error: 'Failed to save reply.' }, { status: 500 })
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
      // BUG-060 FIX: Provide more descriptive feedback if email fails due to sandbox/domain limits.
      const isSandboxError = emailResult.error.message?.toLowerCase().includes('onboarding') || 
                            emailResult.error.message?.toLowerCase().includes('unverified')
      
      const errorMsg = isSandboxError 
        ? 'Reply saved, but email failed. (Resend Error: Domain not verified or unverified recipient in sandbox mode).'
        : `Reply saved, but email could not be sent: ${emailResult.error.message}`

      return NextResponse.json({ 
        success: true, 
        emailWarning: errorMsg,
        resendError: emailResult.error 
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[EnquiryReply] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
