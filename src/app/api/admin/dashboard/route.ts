import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    // Pending proofs (order items with status pending_proof or proof_sent)
    const { count: pendingProofs } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending_proof', 'proof_sent'])

    // In production
    const { count: inProduction } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_production')

    // Completed today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count: completedToday } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', todayStart.toISOString())

    // Total revenue (sum of completed/paid orders)
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total')
      .in('status', ['paid', 'in_production', 'completed'])

    const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) ?? 0

    // Recent orders (last 10)
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*, profile:profiles!orders_user_id_fkey(id, full_name, email, company_name)')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      stats: {
        totalOrders: totalOrders ?? 0,
        pendingProofs: pendingProofs ?? 0,
        inProduction: inProduction ?? 0,
        completedToday: completedToday ?? 0,
        totalRevenue,
      },
      recentOrders: recentOrders ?? [],
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
