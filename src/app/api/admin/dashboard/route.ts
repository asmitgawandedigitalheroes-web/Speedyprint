import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

/**
 * GET /api/admin/dashboard
 * Full pipeline stats: Quote → Order → Artwork → Proof → Production → Completed
 */
export async function GET(_req: NextRequest) {
  const { error, status } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  try {
    const supabase = createAdminClient()
    
    // BUG-024 FIX: Lazy Cleanup of orphaned orders.
    // Instead of a dedicated CRON, we trigger the cleanup whenever an admin 
    // views the dashboard stats. This purges 'pending_payment' orders > 24h old.
    try {
      await supabase.rpc('cleanup_orphaned_orders', { expiry_hours: 24 })
    } catch (cleanupErr) {
      console.error('[Dashboard] Order cleanup failed:', cleanupErr)
      // We don't throw here to avoid breaking the dashboard if cleanup fails
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    // ── Parallel stat queries ──────────────────────────────────────────────────
    const [
      { count: totalOrders },
      { count: quoteOrders },
      { count: paidOrders },
      { count: inProductionOrders },
      { count: completedOrders },
      { count: cancelledOrders },
      { count: pendingArtwork },
      { count: pendingProof },
      { count: proofSent },
      { count: approvedItems },
      { count: completedToday },
      { count: completedThisWeek },
      { count: completedThisMonth },
      { count: readyForProduction },
      { data: revenueAll },
      { data: revenueMonth },
      { data: revenueWeek },
    ] = await Promise.all([
      // Order pipeline stage counts
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'in_production'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),

      // Item-level pipeline stages
      supabase.from('order_items').select('*', { count: 'exact', head: true }).eq('status', 'pending_design'),
      supabase.from('order_items').select('*', { count: 'exact', head: true }).eq('status', 'pending_proof'),
      supabase.from('order_items').select('*', { count: 'exact', head: true }).eq('status', 'proof_sent'),
      supabase.from('order_items').select('*', { count: 'exact', head: true }).eq('status', 'approved'),

      // Time-based completions
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', todayStart.toISOString()),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', weekStart.toISOString()),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', monthStart.toISOString()),

      // Ready for production (approved items = proof approved, awaiting file gen)
      supabase.from('order_items').select('*', { count: 'exact', head: true }).eq('status', 'approved'),

      // Revenue totals
      supabase.from('orders').select('total').in('status', ['paid', 'in_production', 'completed']),
      supabase.from('orders').select('total').in('status', ['paid', 'in_production', 'completed']).gte('created_at', monthStart.toISOString()),
      supabase.from('orders').select('total').in('status', ['paid', 'in_production', 'completed']).gte('created_at', weekStart.toISOString()),
    ])

    const sum = (arr: { total: number }[] | null) =>
      arr?.reduce((s, o) => s + (o.total ?? 0), 0) ?? 0

    // ── Division breakdown ─────────────────────────────────────────────────────
    const { data: divisionData } = await supabase
      .from('order_items')
      .select('product_group:product_groups(division)')
      .not('product_group', 'is', null)

    const divisionCounts: Record<string, number> = {}
    for (const item of divisionData ?? []) {
      const div = (item.product_group as any)?.division
      if (div) divisionCounts[div] = (divisionCounts[div] ?? 0) + 1
    }

    // ── Recent orders ──────────────────────────────────────────────────────────
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(
        `*, profile:profiles!orders_user_id_fkey(id, full_name, email, company_name),
         items:order_items(id, status, product_group:product_groups(name, division))`
      )
      .order('created_at', { ascending: false })
      .limit(10)

    // Annotate with ready_for_production flag
    const annotatedOrders = (recentOrders ?? []).map((order) => {
      const items = (order.items as any[]) ?? []
      const ready_for_production = items.some((i) => i.status === 'approved')
      const has_pending_proof = items.some((i) => ['pending_proof', 'proof_sent'].includes(i.status))
      return { ...order, items: undefined, item_count: items.length, ready_for_production, has_pending_proof }
    })

    // ── Pipeline stages (order-level) ──────────────────────────────────────────
    // Maps the spec: Quote → Order → Artwork → Proof → Production → Completed
    const pipeline = {
      quote:      quoteOrders ?? 0,
      ordered:    paidOrders ?? 0,
      artwork:    pendingArtwork ?? 0,       // items awaiting design
      proof:      (pendingProof ?? 0) + (proofSent ?? 0),  // proof in flight
      production: inProductionOrders ?? 0,
      completed:  completedOrders ?? 0,
    }

    return NextResponse.json({
      stats: {
        totalOrders: totalOrders ?? 0,
        pendingProofs: (pendingProof ?? 0) + (proofSent ?? 0),
        inProduction: inProductionOrders ?? 0,
        completedToday: completedToday ?? 0,
        completedThisWeek: completedThisWeek ?? 0,
        completedThisMonth: completedThisMonth ?? 0,
        readyForProduction: readyForProduction ?? 0,
        approvedItems: approvedItems ?? 0,
        totalRevenue: sum(revenueAll),
        revenueThisMonth: sum(revenueMonth),
        revenueThisWeek: sum(revenueWeek),
        cancelledOrders: cancelledOrders ?? 0,
      },
      pipeline,
      divisionBreakdown: divisionCounts,
      recentOrders: annotatedOrders,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
