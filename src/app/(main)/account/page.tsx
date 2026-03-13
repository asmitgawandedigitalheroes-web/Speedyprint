'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants'
import type { Order, Design } from '@/types'

export default function AccountDashboard() {
  const { user } = useAuth()
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [savedDesigns, setSavedDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    async function fetchData() {
      const [ordersRes, designsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('designs').select('*').eq('user_id', user!.id).order('updated_at', { ascending: false }).limit(6),
      ])
      setRecentOrders((ordersRes.data as Order[]) || [])
      setSavedDesigns((designsRes.data as Design[]) || [])
      setLoading(false)
    }
    fetchData()
  }, [user])

  if (!user) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-black">
          Welcome back, {user.full_name || user.email}
        </h1>
        <p className="mt-1 text-brand-gray-medium">Manage your orders, designs, and profile</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-brand-gray-light bg-white p-6">
          <p className="text-sm text-brand-gray-medium">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-brand-black">{recentOrders.length}</p>
        </div>
        <div className="rounded-lg border border-brand-gray-light bg-white p-6">
          <p className="text-sm text-brand-gray-medium">Saved Designs</p>
          <p className="mt-1 text-2xl font-bold text-brand-black">{savedDesigns.length}</p>
        </div>
        <div className="rounded-lg border border-brand-gray-light bg-white p-6">
          <p className="text-sm text-brand-gray-medium">Member Since</p>
          <p className="mt-1 text-2xl font-bold text-brand-black">{formatDate(user.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-lg border border-brand-gray-light bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-black">Recent Orders</h2>
            <Link href="/account/orders" className="text-sm text-brand-red hover:underline">
              View All
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-brand-gray-medium">No orders yet. Start designing!</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const status = ORDER_STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }
                return (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-brand-black">{order.order_number}</p>
                      <p className="text-sm text-brand-gray-medium">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(order.total)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Saved Designs */}
        <div className="rounded-lg border border-brand-gray-light bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-black">Saved Designs</h2>
            <Link href="/account/designs" className="text-sm text-brand-red hover:underline">
              View All
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : savedDesigns.length === 0 ? (
            <p className="text-brand-gray-medium">No saved designs yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {savedDesigns.map((design) => (
                <Link
                  key={design.id}
                  href={design.product_template_id ? `/designer/${design.product_template_id}?design=${design.id}` : '#'}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                >
                  {design.thumbnail_url ? (
                    <img src={design.thumbnail_url} alt={design.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-brand-gray-medium">
                      <span className="text-xs">{design.name}</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100">
                    {design.name}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
