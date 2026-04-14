import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'
import { sendQuoteReply } from '@/lib/email/resend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error: authError, status: authStatus, user } = await requireAdmin()
  if (authError || !user) return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: authStatus })

  const body = await request.json()
  const { reply_message, quoted_price, quote_valid_days } = body

  if (!reply_message?.trim()) {
    return NextResponse.json({ error: 'Reply message is required.' }, { status: 400 })
  }
  if (reply_message.length > 5000) {
    return NextResponse.json({ error: 'Reply message is too long.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch the quote
  const { data: quote, error: fetchError } = await admin
    .from('quote_requests')
    .select('id, full_name, email, status')
    .eq('id', id)
    .single()

  if (fetchError || !quote) {
    return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })
  }

  // Update quote record
  const patch: Record<string, unknown> = {
    reply_message: reply_message.trim(),
    replied_at: new Date().toISOString(),
    replied_by: user.id,
    status: 'quoted',
  }
  if (quoted_price !== undefined && quoted_price !== null) {
    const price = Number(quoted_price)
    if (!isNaN(price) && price >= 0) patch.quoted_price = price
  }
  if (quote_valid_days) {
    patch.quote_valid_days = Math.max(1, parseInt(quote_valid_days))
  }

  const { data: updated, error: updateError } = await admin
    .from('quote_requests')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (updateError || !updated) {
    console.error('[Admin/Quotes/Reply] Update error:', updateError)
    return NextResponse.json({ error: 'Failed to save reply.' }, { status: 500 })
  }

  // Send customer email
  try {
    await sendQuoteReply(
      quote.full_name,
      quote.email,
      reply_message.trim(),
      patch.quoted_price as number | null,
      patch.quote_valid_days as number | null
    )
  } catch (emailErr) {
    console.error('[Admin/Quotes/Reply] Email error:', emailErr)
    // Non-fatal — reply is saved, just log it
  }

  return NextResponse.json(updated)
}
