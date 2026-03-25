'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants'
import { ArrowRight } from 'lucide-react'
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
    <div className="bg-brand-bg min-h-screen">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-3" />
          <h1 className="font-heading text-2xl font-bold text-brand-text">
            Welcome back, {user.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-1 text-sm text-brand-text-muted">Manage your orders, designs, and profile</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total orders', value: recentOrders.length },
            { label: 'Saved designs', value: savedDesigns.length },
            { label: 'Member since', value: formatDate(user.created_at) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-md border border-gray-100 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-brand-text-muted">{stat.label}</p>
              <p className="mt-2 font-heading text-2xl font-bold text-brand-text">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent orders */}
          <div className="rounded-md border border-gray-100 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-heading text-base font-semibold text-brand-text">Recent orders</h2>
              <Link href="/account/orders" className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-primary-dark">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />)}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-brand-text-muted">No orders yet.</p>
                  <Link href="/products" className="mt-3 inline-block text-sm font-medium text-brand-primary">Start designing →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((order) => {
                    const status = ORDER_STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }
                    return (
                      <Link key={order.id} href={`/account/orders/${order.id}`}
                        className="flex items-center justify-between rounded-md border border-gray-100 p-3 transition hover:border-brand-primary/30 hover:bg-brand-bg">
                        <div>
                          <p className="text-sm font-medium text-brand-text">{order.order_number}</p>
                          <p className="text-xs text-brand-text-muted">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-brand-text">{formatCurrency(order.total)}</span>
                          <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${status.color}`}>{status.label}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Saved designs */}
          <div className="rounded-md border border-gray-100 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-heading text-base font-semibold text-brand-text">Saved designs</h2>
              <Link href="/account/designs" className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-primary-dark">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => <div key={i} className="aspect-square animate-pulse rounded bg-gray-100" />)}
                </div>
              ) : savedDesigns.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-brand-text-muted">No saved designs yet.</p>
                  <Link href="/templates" className="mt-3 inline-block text-sm font-medium text-brand-primary">Browse templates →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {savedDesigns.map((design) => (
                    <Link key={design.id}
                      href={design.product_template_id ? `/designer/${design.product_template_id}?design=${design.id}` : '#'}
                      className="group relative aspect-square overflow-hidden rounded-md border border-gray-100 bg-brand-bg">
                      {design.thumbnail_url
                        ? <img src={design.thumbnail_url} alt={design.name} className="h-full w-full object-cover" />
                        : <div className="flex h-full items-center justify-center text-xs text-brand-text-muted">{design.name}</div>}
                      <div className="absolute inset-x-0 bottom-0 bg-brand-secondary/80 p-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100 truncate">
                        {design.name}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Place new order', href: '/order-now', primary: true },
            { label: 'Browse templates', href: '/templates', primary: false },
            { label: 'Edit profile', href: '/account/profile', primary: false },
          ].map((action) => (
            <Link key={action.label} href={action.href}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition ${
                action.primary
                  ? 'bg-brand-primary text-white hover:bg-brand-primary-dark'
                  : 'border border-gray-200 bg-white text-brand-text hover:border-brand-primary hover:text-brand-primary'
              }`}>
              {action.label} {action.primary && <ArrowRight className="h-4 w-4" />}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
