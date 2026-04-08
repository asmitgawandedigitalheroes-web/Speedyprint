import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generatePDF, mergeVariables } from '@/lib/pdf/generator'
import { sendProofReady } from '@/lib/email/resend'
import { logProofAudit, getClientIp } from '@/lib/proofAudit'
import { logActivity } from '@/lib/audit'
import { SITE_URL } from '@/lib/utils/constants'
import type { Order, ProductTemplate } from '@/types'

// ── POST /api/proofs – Admin generates a proof for an order item ──────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Admin / production_staff only
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'production_staff'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { order_item_id, design_id } = body

  if (!order_item_id)
    return NextResponse.json({ error: 'order_item_id is required' }, { status: 400 })

  // Get next version number
  const { data: existing } = await admin
    .from('proofs')
    .select('version')
    .eq('order_item_id', order_item_id)
    .order('version', { ascending: false })
    .limit(1)

  const version = existing && existing.length > 0 ? existing[0].version + 1 : 1

  // ── Generate proof PDF ──────────────────────────────────────────────────────
  let proof_file_url: string | null = body.proof_file_url ?? null
  let proof_thumbnail_url: string | null = body.proof_thumbnail_url ?? null
  let orderItem: any = null

  try {
    const { data: item } = await admin
      .from('order_items')
      .select('design_id, product_template_id, csv_job_id, csv_job:csv_jobs(parsed_data, column_mapping), order:orders(order_number)')
      .eq('id', order_item_id)
      .single()
    orderItem = item

    const resolvedDesignId = design_id || item?.design_id

    if (resolvedDesignId) {
      const { data: design } = await admin
        .from('designs')
        .select('canvas_json, product_template:product_templates(print_width_mm, print_height_mm, bleed_mm)')
        .eq('id', resolvedDesignId)
        .single()

      if (design?.canvas_json) {
        const tpl = design.product_template as unknown as ProductTemplate | null
        const baseCanvas = design.canvas_json as any
        const printSpecs = {
          print_width_mm: tpl?.print_width_mm ?? 100,
          print_height_mm: tpl?.print_height_mm ?? 70,
          bleed_mm: tpl?.bleed_mm ?? 3,
        }

        let pdfBytes: Uint8Array

        // CSV Sample Case: Generate up to 5 sample pages
        if (item?.csv_job_id && item?.csv_job) {
          const csvJob = item.csv_job as any
          const rows = (csvJob.parsed_data ?? []) as any[]
          const colMap = (csvJob.column_mapping ?? {}) as Record<string, string>
          const sampleCount = Math.min(rows.length, 5)
          const sampleRows = rows.slice(0, sampleCount)

          const canvases = sampleRows.map((row) => {
            const vars: Record<string, string> = {}
            for (const [p, c] of Object.entries(colMap)) vars[p] = String(row[c] ?? '')
            return mergeVariables(baseCanvas, vars)
          })

          pdfBytes = await generatePDF(canvases, printSpecs, { isProof: true, includeBleed: false })
        } else {
          // Single Design Case
          pdfBytes = await generatePDF(baseCanvas, printSpecs, { isProof: true, includeBleed: false })
        }

        const storagePath = `${order_item_id}/v${version}_proof.pdf`
        const { error: uploadError } = await admin.storage
          .from('proofs')
          .upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true })

        if (uploadError) {
          console.error('[Proof] PDF upload error:', uploadError)
          return NextResponse.json({ 
            error: 'Failed to upload proof file to storage. Please ensure the bucket exists and is accessible.',
            details: uploadError.message
          }, { status: 500 })
        }

        const { data: { publicUrl } } = admin.storage.from('proofs').getPublicUrl(storagePath)
        proof_file_url = publicUrl
        proof_thumbnail_url = publicUrl
      } else {
        return NextResponse.json({ error: 'Design canvas data is missing. Cannot generate proof.' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'No design associated with this item or provided in request.' }, { status: 400 })
    }
  } catch (genErr: any) {
    console.error('[Proof] PDF generation error:', genErr)
    return NextResponse.json({ error: 'Failed to generate proof PDF.', details: genErr.message }, { status: 500 })
  }

  // ── Insert proof record ────────────────────────────────────────────────────
  const { data: proof, error } = await admin
    .from('proofs')
    .insert({
      order_item_id,
      design_id: design_id ?? null,
      version,
      proof_file_url,
      proof_thumbnail_url,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update order item status to proof_sent ONLY after successful proof creation
  await admin.from('order_items').update({ status: 'proof_sent' }).eq('id', order_item_id)

  // ── Audit log ─────────────────────────────────────────────────────────────
  await logProofAudit({
    proof_id:      proof!.id,
    order_item_id,
    action:        'proof_created',
    actor_id:      user.id,
    actor_role:    profile.role as 'admin' | 'production_staff',
    client_ip:     getClientIp(request.headers),
    metadata:      { version, design_id: design_id ?? null },
  })

  // Global Audit Log
  await logActivity({
    user_id: user.id,
    action: 'proof_created',
    entity_type: 'proof',
    entity_id: proof!.id,
    metadata: { 
      order_item_id, 
      version,
      order_number: (orderItem?.order as any)?.order_number
    },
    is_admin_action: true,
  })

  // ── Send "proof ready" email to customer ───────────────────────────────────
  try {
    const { data: item } = await admin
      .from('order_items')
      .select('order:orders(id, order_number, user_id, profile:profiles!orders_user_id_fkey(email))')
      .eq('id', order_item_id)
      .single()

    const order = item?.order as unknown as (Order & { profile?: { email: string } }) | null
    const customerEmail = (order as any)?.profile?.email

    if (order && customerEmail) {
      const proofUrl = `${SITE_URL}/account/orders/${(order as any).id}/proof/${order_item_id}`
      await sendProofReady(order, proofUrl, customerEmail)
    }
  } catch (emailErr) {
    console.error('[Proof] Email send error:', emailErr)
  }

  return NextResponse.json(proof, { status: 201 })
}
