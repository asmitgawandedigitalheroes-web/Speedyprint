import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

/**
 * GET /api/admin/orders
 *
 * Full order pipeline with filters:
 *   status, search, date_from, date_to, division, product_type, ready_for_production
 *
 * Returns enriched orders with:
 *   item_count, proof_summary, production_file_count, ready_for_production, divisions[]
 */
export async function GET(request: NextRequest) {
  const { error, status } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10))
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const search = searchParams.get('search')?.trim()
    const division = searchParams.get('division')
    const productType = searchParams.get('product_type')?.trim()
    const readyForProduction = searchParams.get('ready_for_production') === 'true'

    const from = (page - 1) * limit
    const to = from + limit - 1

    // ── Optional pre-filter by division or product_type ────────────────────────
    // These require resolving matching order_ids through order_items → product_groups
    let divisionOrderIds: string[] | null = null
    if (division || productType) {
      let itemQuery = supabase
        .from('order_items')
        .select('order_id, product_group:product_groups(division, name)')

      // We filter client-side since Supabase can't filter on joined columns directly
      const { data: matchingItems } = await itemQuery
      const filtered = (matchingItems ?? []).filter((item) => {
        const pg = item.product_group as any
        if (division && pg?.division !== division) return false
        if (productType && !pg?.name?.toLowerCase().includes(productType.toLowerCase())) return false
        return true
      })
      divisionOrderIds = [...new Set(filtered.map((i: any) => i.order_id).filter(Boolean))]
      if (divisionOrderIds.length === 0) {
        // No matches — return empty result immediately
        return NextResponse.json({
          orders: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
    }

    // ── Optional pre-filter: ready_for_production ──────────────────────────────
    let readyOrderIds: string[] | null = null
    if (readyForProduction) {
      const { data: approvedItems } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('status', 'approved')
      readyOrderIds = [...new Set((approvedItems ?? []).map((i) => i.order_id).filter(Boolean))]
      if (readyOrderIds.length === 0) {
        return NextResponse.json({
          orders: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
    }

    // ── Main orders query ──────────────────────────────────────────────────────
    let query = supabase
      .from('orders')
      .select(
        `*,
         profile:profiles!orders_user_id_fkey(id, full_name, email, company_name, phone),
         items:order_items(
           id, status, quantity, design_id, csv_job_id,
           product_group:product_groups(id, name, division),
           proofs(id, status, version),
           production_files(id, file_type, generated_at)
         )`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status && status !== 'all') query = query.eq('status', status)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      query = query.lte('created_at', end.toISOString())
    }
    if (divisionOrderIds) query = query.in('id', divisionOrderIds)
    if (readyOrderIds) query = query.in('id', readyOrderIds)

    // BUG-005 FIX: Full-text search across order_number, customer name, and email.
    // Previously used .or() with joined-table columns (profile.full_name, profile.email)
    // which PostgREST does not support in a flat filter string — causing 400/500 errors.
    // Solution: pre-resolve matching profile IDs, then build a valid .or() on direct columns.
    if (search) {
      const { data: profileMatches } = await supabase
        .from('profiles')
        .select('id')
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)

      const matchedUserIds = (profileMatches ?? []).map((p) => p.id)

      if (matchedUserIds.length > 0) {
        query = query.or(
          `order_number.ilike.%${search}%,user_id.in.(${matchedUserIds.join(',')})`
        )
      } else {
        query = query.ilike('order_number', `%${search}%`)
      }
    }

    const { data: orders, count, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // ── Enrich each order ──────────────────────────────────────────────────────
    const enriched = (orders ?? []).map((order) => {
      const items = (order.items as any[]) ?? []

      // Proof summary
      const allProofs = items.flatMap((i) => (i.proofs as any[]) ?? [])
      const proofSummary = {
        total: allProofs.length,
        pending: allProofs.filter((p) => p.status === 'pending').length,
        approved: allProofs.filter((p) => p.status === 'approved').length,
        revision_requested: allProofs.filter((p) => p.status === 'revision_requested').length,
      }

      // Production files
      const allProdFiles = items.flatMap((i) => (i.production_files as any[]) ?? [])
      const productionFileCount = allProdFiles.filter((f) => f.file_type === 'pdf').length
      const latestFileDate = allProdFiles
        .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())[0]
        ?.generated_at ?? null

      // Ready for production: has at least one approved item
      const readyForProd = items.some((i) => i.status === 'approved')
      const hasPendingProof = items.some((i) => ['pending_proof', 'proof_sent'].includes(i.status))
      const hasCsvOrder = items.some((i) => !!i.csv_job_id)

      // Unique divisions
      const divisions = [
        ...new Set(
          items.map((i) => (i.product_group as any)?.division).filter(Boolean)
        ),
      ] as string[]

      const productTypes = [
        ...new Set(
          items.map((i) => (i.product_group as any)?.name).filter(Boolean)
        ),
      ] as string[]

      return {
        ...order,
        items: undefined, // remove raw items from response
        item_count: items.length,
        item_statuses: items.map((i) => i.status),
        proof_summary: proofSummary,
        production_file_count: productionFileCount,
        production_latest_at: latestFileDate,
        ready_for_production: readyForProd,
        has_pending_proof: hasPendingProof,
        has_csv_order: hasCsvOrder,
        divisions,
        product_types: productTypes,
      }
    })

    return NextResponse.json({
      orders: enriched,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (error) {
    console.error('Orders list error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
