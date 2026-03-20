import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generatePDF } from '@/lib/pdf/generator'
import { sendProofReady } from '@/lib/email/resend'
import { SITE_URL } from '@/lib/utils/constants'
import type { Order, ProductTemplate } from '@/types'

// ── POST: admin generates a new proof for any order item ──────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'production_staff'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { order_item_id } = body
  if (!order_item_id)
    return NextResponse.json({ error: 'order_item_id is required' }, { status: 400 })

  // Get next version number
  const { data: existing } = await admin
    .from('proofs').select('version').eq('order_item_id', order_item_id)
    .order('version', { ascending: false }).limit(1)
  const version = existing && existing.length > 0 ? existing[0].version + 1 : 1

  // Resolve design from order item
  const { data: item } = await admin
    .from('order_items').select('design_id, product_template_id').eq('id', order_item_id).single()

  let proof_file_url: string | null = null
  let proof_thumbnail_url: string | null = null

  if (item?.design_id) {
    try {
      const { data: design } = await admin
        .from('designs')
        .select('canvas_json, product_template:product_templates(print_width_mm, print_height_mm, bleed_mm)')
        .eq('id', item.design_id).single()

      if (design?.canvas_json) {
        const tpl = design.product_template as unknown as ProductTemplate | null
        const pdfBytes = await generatePDF(
          design.canvas_json as Parameters<typeof generatePDF>[0],
          { print_width_mm: tpl?.print_width_mm ?? 100, print_height_mm: tpl?.print_height_mm ?? 70, bleed_mm: tpl?.bleed_mm ?? 3 },
          { isProof: true, includeBleed: false }
        )
        const storagePath = `${order_item_id}/v${version}_proof.pdf`
        const { error: uploadErr } = await admin.storage
          .from('proofs').upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true })
        if (!uploadErr) {
          const { data: { publicUrl } } = admin.storage.from('proofs').getPublicUrl(storagePath)
          proof_file_url = publicUrl
          proof_thumbnail_url = publicUrl
        }
      }
    } catch (genErr) {
      console.error('[AdminProof] PDF gen error:', genErr)
    }
  }

  // Insert proof record
  const { data: proof, error } = await admin
    .from('proofs')
    .insert({ order_item_id, design_id: item?.design_id ?? null, version, proof_file_url, proof_thumbnail_url, status: 'pending' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update order item status
  await admin.from('order_items').update({ status: 'proof_sent' }).eq('id', order_item_id)

  // Send email to customer
  try {
    const { data: orderItem } = await admin
      .from('order_items')
      .select('order:orders(id, order_number, user_id, profile:profiles!orders_user_id_fkey(email))')
      .eq('id', order_item_id).single()
    const order = orderItem?.order as unknown as (Order & { profile?: { email: string } }) | null
    const customerEmail = (order as any)?.profile?.email
    if (order && customerEmail) {
      const proofUrl = `${SITE_URL}/account/orders/${(order as any).id}/proof/${order_item_id}`
      await sendProofReady(order, proofUrl, customerEmail)
    }
  } catch (emailErr) {
    console.error('[AdminProof] Email error:', emailErr)
  }

  return NextResponse.json(proof, { status: 201 })
}

// ── GET: list all proofs (admin) ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'production_staff'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status   = searchParams.get('status')
  const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
  const limit    = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
  const offset   = (page - 1) * limit

  let query = admin
    .from('proofs')
    .select(
      `*,
       order_item:order_items(
         id, status, quantity,
         order:orders(id, order_number),
         product_group:product_groups(name),
         product_template:product_templates(name)
       )`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = (query as any).eq('status', status)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ proofs: data ?? [], total: count ?? 0, page, limit })
}
