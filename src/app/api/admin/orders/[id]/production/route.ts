import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  generateOrderProductionFiles,
  getOrderProductionStatus,
} from '@/lib/production/generator'

type RouteParams = { params: Promise<{ id: string }> }

// ── GET /api/admin/orders/:id/production ──────────────────────────────────────
// Returns the current production status for an order:
// whether files have been generated, file count, manifest URL, etc.
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'production_staff'].includes(profile.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const status = await getOrderProductionStatus(id)
    return NextResponse.json(status)
  } catch (err) {
    console.error('[ProductionStatus] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── POST /api/admin/orders/:id/production ─────────────────────────────────────
// Triggers generation of all production files for this order.
// Body (optional):
//   { formats: ['pdf', 'png'], force: true }
//
// Returns the full ProductionResult including manifest, file list, and errors.
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'production_staff'].includes(profile.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Confirm order exists
    const { data: order } = await admin
      .from('orders')
      .select('id, order_number, status')
      .eq('id', id)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const body = await request.json().catch(() => ({}))
    const formats: ('pdf' | 'png')[] = body.formats ?? ['pdf']
    const force: boolean = body.force ?? false

    // Run production file generation
    const result = await generateOrderProductionFiles(id, { formats, force })

    const statusCode = result.errors.length > 0 && result.files.length === 0 ? 422 : 201

    return NextResponse.json(
      {
        success: result.files.length > 0,
        order_number: result.order_number,
        files_generated: result.files.filter((f) => f.file_type === 'pdf').length,
        png_pending: result.files.filter((f) => f.file_type === 'png' && f.metadata.png_pending).length,
        errors: result.errors,
        skipped_items: result.skipped_items,
        manifest: result.manifest,
      },
      { status: statusCode }
    )
  } catch (err) {
    console.error('[GenerateProduction] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
