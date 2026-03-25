'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants'
import { ArrowRight } from 'lucide-react'
import type { Order } from '@/types'

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) || [])
        setLoading(false)
      })
  }, [user])

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-3" />
          <h1 className="font-heading text-2xl font-bold text-brand-text">My orders</h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 animate-pulse rounded-md bg-white" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-md border border-gray-100 bg-white p-16 text-center">
            <div className="mx-auto mb-4 h-1 w-8 bg-brand-primary" />
            <p className="text-brand-text-muted">You haven&apos;t placed any orders yet.</p>
            <Link href="/products" className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
              Browse products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = ORDER_STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }
              return (
                <Link key={order.id} href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between rounded-md border border-gray-100 bg-white p-5 transition hover:border-brand-primary/30 hover:shadow-sm">
                  <div>
                    <p className="font-semibold text-brand-text">{order.order_number}</p>
                    <p className="mt-0.5 text-sm text-brand-text-muted">Placed {formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-brand-text">{formatCurrency(order.total)}</p>
                    <span className={`rounded-sm px-2.5 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
                    <ArrowRight className="h-4 w-4 text-brand-text-muted" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
