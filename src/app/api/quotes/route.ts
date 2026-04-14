import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendQuoteNotification } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  const body = await request.json()

  const {
    full_name,
    email,
    phone,
    company,
    event_name,
    event_date,
    delivery_date,
    product_type,
    quantity,
    dimensions,
    material,
    finish,
    special_instructions,
    referral,
    artwork_url,
  } = body

  // Basic validation
  if (!full_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }
  if (typeof special_instructions === 'string' && special_instructions.length > 5000) {
    return NextResponse.json({ error: 'Special instructions are too long.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: quote, error } = await admin
    .from('quote_requests')
    .insert({
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      event_name: event_name?.trim() || null,
      event_date: event_date || null,
      delivery_date: delivery_date || null,
      product_type: product_type || null,
      quantity: quantity?.toString() || null,
      dimensions: dimensions?.trim() || null,
      material: material?.trim() || null,
      finish: finish || null,
      special_instructions: special_instructions?.trim() || null,
      referral: referral || null,
      artwork_url: artwork_url || null,
      status: 'new',
    })
    .select('id')
    .single()

  if (error || !quote) {
    console.error('[Quotes] Insert error:', error)
    return NextResponse.json({ error: 'Failed to save quote request.' }, { status: 500 })
  }

  // Send admin notification (non-fatal)
  try {
    await sendQuoteNotification({
      full_name,
      email,
      phone,
      company,
      event_name,
      event_date,
      delivery_date,
      product_type,
      quantity: quantity?.toString(),
      dimensions,
      material,
      finish,
      special_instructions,
      referral,
      artwork_url,
      quoteId: quote.id,
    })
  } catch (emailErr) {
    console.error('[Quotes] Notification email error:', emailErr)
  }

  return NextResponse.json({ id: quote.id }, { status: 201 })
}
