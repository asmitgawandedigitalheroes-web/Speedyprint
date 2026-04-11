import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { generatePDF } from '@/lib/pdf/generator'
import { sendAdminProofApproved } from '@/lib/email/resend'
import { logProofAudit, getClientIp } from '@/lib/proofAudit'
import type { ProductTemplate } from '@/types'

// ── POST /api/proofs/:id/generate-production ──────────────────────────────────
// Generates the final production-ready PDF (with bleed) after a proof is approved.
// Called by admin or triggered automatically after approval.
// Uploads to the `production` storage bucket and records in `production_files`.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Admin / production_staff only
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'production_staff'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Load proof
  const { data: proof, error: proofErr } = await admin
    .from('proofs')
    .select('*')
    .eq('id', id)
    .single()

  if (proofErr || !proof)
    return NextResponse.json({ error: 'Proof not found' }, { status: 404 })

  if (proof.status !== 'approved')
    return NextResponse.json({ error: 'Proof must be approved before generating production files' }, { status: 400 })

  const designId = proof.design_id
  if (!designId)
    return NextResponse.json({ error: 'No design linked to this proof' }, { status: 400 })

  // Load design + template specs
  const { data: design } = await admin
    .from('designs')
    .select('canvas_json, product_template:product_templates(print_width_mm, print_height_mm, bleed_mm, name)')
    .eq('id', designId)
    .single()

  if (!design?.canvas_json)
    return NextResponse.json({ error: 'Design canvas not found' }, { status: 400 })

  const tpl = design.product_template as unknown as ProductTemplate | null
  const printSpecs = {
    print_width_mm: tpl?.print_width_mm ?? 100,
    print_height_mm: tpl?.print_height_mm ?? 70,
    bleed_mm: tpl?.bleed_mm ?? 3,
  }

  // Generate production PDF (full bleed, 300 DPI)
  let pdfBytes: Uint8Array
  try {
    pdfBytes = await generatePDF(
      design.canvas_json as Parameters<typeof generatePDF>[0],
      printSpecs,
      { isProof: false, includeBleed: true }
    )
  } catch (genErr) {
    console.error('[GenerateProduction] PDF generation error:', genErr)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  // Upload to production bucket
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const fileName = `PROD_${proof.order_item_id}_v${proof.version}_${dateStr}.pdf`
  const storagePath = `${proof.order_item_id}/${fileName}`

  const { error: uploadError } = await admin.storage
    .from('production')
    .upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true })

  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('production').getPublicUrl(storagePath)

  // Record in production_files table
  const { data: productionFile, error: fileErr } = await admin
    .from('production_files')
    .insert({
      order_item_id: proof.order_item_id,
      proof_id: id,
      file_url: publicUrl,
      file_type: 'pdf',
      file_name: fileName,
      resolution_dpi: 300,
      has_bleed: true,
      metadata: { template: tpl?.name, proof_version: proof.version, generated_by: user.id },
    })
    .select()
    .single()

  if (fileErr)
    return NextResponse.json({ error: fileErr.message }, { status: 500 })

  // Move order item to in_production
  await admin.from('order_items').update({ status: 'in_production' }).eq('id', proof.order_item_id)

  // ── Audit log ─────────────────────────────────────────────────────────────
  await logProofAudit({
    proof_id:      id,
    order_item_id: proof.order_item_id,
    action:        'production_generated',
    actor_id:      user.id,
    actor_role:    profile.role as 'admin' | 'production_staff',
    client_ip:     getClientIp(request.headers),
    metadata:      {
      file_name:      fileName,
      file_url:       publicUrl,
      proof_version:  proof.version,
      template:       tpl?.name ?? null,
    },
  })

  // Notify admin team
  try {
    const { data: item } = await admin
      .from('order_items')
      .select('order:orders!order_id(order_number), product_group:product_groups!product_group_id(name)')
      .eq('id', proof.order_item_id)
      .single()

    const orderNum = (item?.order as any)?.order_number
    const productName = (item?.product_group as any)?.name ?? 'product'
    if (orderNum) await sendAdminProofApproved(orderNum, productName)
  } catch (emailErr) {
    console.error('[GenerateProduction] Admin notification error:', emailErr)
  }

  return NextResponse.json({
    production_file: productionFile,
    file_url: publicUrl,
    file_name: fileName,
  })
}
