'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants'
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-black">My Orders</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-brand-gray-light bg-white p-12 text-center">
          <p className="text-lg text-brand-gray-medium">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="mt-4 inline-block rounded-lg bg-brand-red px-6 py-2 text-white hover:bg-brand-red-light">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = ORDER_STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }
            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between rounded-lg border border-brand-gray-light bg-white p-6 transition hover:shadow-md"
              >
                <div>
                  <p className="text-lg font-semibold text-brand-black">{order.order_number}</p>
                  <p className="text-sm text-brand-gray-medium">Placed {formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-semibold">{formatCurrency(order.total)}</p>
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
