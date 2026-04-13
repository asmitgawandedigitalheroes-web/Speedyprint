'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import {
  ShoppingBag,
  Printer,
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
  Tag,
  Hash,
  Zap,
  Stamp,
  Trophy,
  Bike,
} from 'lucide-react'
import type { Order } from '@/types'

/* ── Product category shortcuts ── */
const PRODUCT_SHORTCUTS = [
  { label: 'Labels & Stickers', href: '/labels',        icon: Tag,    color: '#E30613', bg: 'rgba(227,6,19,0.08)'   },
  { label: 'Race Numbers',      href: '/race-numbers',  icon: Hash,   color: '#1E293B', bg: 'rgba(30,41,59,0.08)'   },
  { label: 'MTB Boards',        href: '/mtb-boards',    icon: Bike,   color: '#0284c7', bg: 'rgba(2,132,199,0.08)'  },
  { label: 'Laser Products',    href: '/laser',         icon: Zap,    color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  { label: 'Stamps',            href: '/stamps',        icon: Stamp,  color: '#d97706', bg: 'rgba(217,119,6,0.08)'  },
  { label: 'Trophies',          href: '/trophies',      icon: Trophy, color: '#16a34a', bg: 'rgba(22,163,74,0.08)'  },
]

/* ─── Brand-safe status badge ─── */
const ORDER_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  draft:           { label: 'Draft',           bg: 'rgba(224,224,224,0.9)', text: '#555555' },
  pending_payment: { label: 'Pending Payment', bg: 'rgba(255,193,7,0.18)',  text: '#7a5c00' },
  paid:            { label: 'Paid',            bg: 'rgba(34,197,94,0.12)',  text: '#15803d' },
  in_production:   { label: 'In Production',   bg: 'rgba(227,6,19,0.12)',   text: '#c00510' },
  completed:       { label: 'Completed',       bg: 'rgba(30,41,59,0.18)',   text: '#1E293B' },
  cancelled:       { label: 'Cancelled',       bg: 'rgba(227,6,19,0.08)',   text: '#E30613' },
}

function OrderBadge({ status }: { status: string }) {
  const s = ORDER_BADGE[status] ?? { label: status, bg: '#E0E0E0', text: '#333' }
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

function SkeletonCard() {
  return <div className="h-24 animate-pulse rounded-xl bg-white/60" />
}

export default function AccountDashboard() {
  const { user } = useAuth()
  const [orders,       setOrders]       = useState<Order[]>([])
  const [proofCount,   setProofCount]   = useState(0)
  const [proofOrders,  setProofOrders]  = useState<{ orderId: string; orderNumber: string; itemId: string }[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    async function fetchDashboard() {
      /* All orders (for stats + recent list) */
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, order_number, status, total, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      const orderList = (allOrders ?? []) as Order[]
      setOrders(orderList)

      /* Items awaiting proof approval */
      if (orderList.length > 0) {
        const ids = orderList.map((o: Order) => o.id)
        const { data: items } = await supabase
          .from('order_items')
          .select('id, order_id, status')
          .in('order_id', ids)
          .eq('status', 'proof_sent')

        const pending = items ?? []
        setProofCount(pending.length)
        setProofOrders(
          pending.map((i: any) => ({
            itemId:      i.id,
            orderId:     i.order_id,
            orderNumber: orderList.find((o: Order) => o.id === i.order_id)?.order_number ?? i.order_id,
          }))
        )
      }

      setLoading(false)
    }

    fetchDashboard()
  }, [user])

  if (!user) return null

  /* ── Derived stats ── */
  const totalOrders  = orders.length
  const activeOrders = orders.filter((o) => o.status === 'paid' || o.status === 'in_production').length
  const completed    = orders.filter((o) => o.status === 'completed').length
  const recentOrders = orders.slice(0, 5)

  const stats = [
    {
      label:   'Total Orders',
      value:   totalOrders,
      icon:    ShoppingBag,
      accent:  false,
      warning: false,
    },
    {
      label:   'In Progress',
      value:   activeOrders,
      icon:    Printer,
      accent:  true,
      warning: false,
    },
    {
      label:   'Pending Proofs',
      value:   proofCount,
      icon:    Clock,
      accent:  false,
      warning: proofCount > 0,
    },
    {
      label:   'Completed',
      value:   completed,
      icon:    CheckCircle2,
      accent:  false,
      warning: false,
    },
  ]

  return (
    <div className="p-6 lg:p-8">

      {/* ── Page header ── */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">
          Welcome back
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-brand-text">
          {user.full_name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Here&apos;s a snapshot of your account.
        </p>
      </div>

      {/* ── Proof alert banner ── */}
      {proofCount > 0 && (
        <div
          className="mb-6 flex items-start gap-4 rounded-xl border px-5 py-4"
          style={{
            backgroundColor: 'rgba(255,193,7,0.10)',
            borderColor:     'rgba(255,193,7,0.45)',
          }}
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-brand-yellow" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#7a5c00' }}>
              {proofCount === 1
                ? '1 proof is waiting for your approval'
                : `${proofCount} proofs are waiting for your approval`}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: '#7a5c00', opacity: 0.8 }}>
              Review and approve to move your order into production.
            </p>
          </div>
          <Link
            href="/account/proofs"
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: '#FFC107', color: '#1a1a2e' }}
          >
            Review now
          </Link>
        </div>
      )}

      {/* ── Stats cards ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading
          ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
          : stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm"
                  style={{
                    borderColor: stat.warning
                      ? 'rgba(255,193,7,0.5)'
                      : stat.accent
                      ? 'rgba(227,6,19,0.2)'
                      : '#E7E5E4',
                  }}
                >
                  {/* Decorative corner accent */}
                  <div
                    className="absolute right-0 top-0 h-16 w-16 rounded-bl-full opacity-[0.06]"
                    style={{
                      background: stat.warning
                        ? '#FFC107'
                        : stat.accent
                        ? '#E30613'
                        : '#1E293B',
                    }}
                  />
                  <div
                    className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{
                      background: stat.warning
                        ? 'rgba(255,193,7,0.15)'
                        : stat.accent
                        ? 'rgba(227,6,19,0.10)'
                        : 'rgba(30,41,59,0.08)',
                    }}
                  >
                    <Icon
                      className="h-4.5 w-4.5"
                      style={{
                        color: stat.warning
                          ? '#7a5c00'
                          : stat.accent
                          ? '#E30613'
                          : '#1E293B',
                      }}
                    />
                  </div>
                  <p className="font-heading text-2xl font-bold text-brand-text">{stat.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-brand-text-muted">{stat.label}</p>
                </div>
              )
            })}
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid gap-6 xl:grid-cols-5">

        {/* Recent Orders — 3/5 width */}
        <div className="xl:col-span-3">
          <div className="rounded-xl border border-[#E7E5E4] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E7E5E4] px-6 py-4">
              <h2 className="font-heading text-base font-semibold text-brand-text">Recent Orders</h2>
              <Link
                href="/account/orders"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-[#F5F6F7]" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F6F7]">
                  <ShoppingBag className="h-5 w-5 text-brand-text-muted" />
                </div>
                <p className="text-sm font-medium text-brand-text">No orders yet</p>
                <p className="mt-1 text-xs text-brand-text-muted">Place your first order to get started.</p>
                <Link
                  href="/order-now"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-primary-dark"
                >
                  Start Designing <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#F0F0F0]">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-3.5 transition hover:bg-[#FAFAFA]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-text">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-brand-text-muted">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-brand-text">
                        {formatCurrency(order.total)}
                      </span>
                      <OrderBadge status={order.status} />
                      <ChevronRight className="h-3.5 w-3.5 text-brand-text-muted" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order New + Proof Alerts — 2/5 width */}
        <div className="flex flex-col gap-6 xl:col-span-2">

          {/* Product category shortcuts */}
          <div className="rounded-xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold text-brand-text">Order a Product</h2>
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
              >
                All products <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRODUCT_SHORTCUTS.map((cat) => {
                const Icon = cat.icon
                return (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className="group flex items-center gap-2.5 rounded-lg border border-[#E7E5E4] px-3 py-2.5 text-xs font-semibold text-brand-text transition hover:border-transparent hover:shadow-sm"
                    style={{ ['--cat-bg' as string]: cat.bg }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = cat.bg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                      style={{ background: cat.bg }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
                    </span>
                    <span className="leading-tight">{cat.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Pending Proofs list */}
          {proofOrders.length > 0 && (
            <div
              className="rounded-xl border p-5"
              style={{
                backgroundColor: 'rgba(255,193,7,0.06)',
                borderColor:     'rgba(255,193,7,0.35)',
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-yellow" />
                <h2 className="font-heading text-sm font-semibold" style={{ color: '#7a5c00' }}>
                  Proofs Awaiting Approval
                </h2>
              </div>
              <div className="flex flex-col gap-1.5">
                {proofOrders.slice(0, 4).map((p) => (
                  <Link
                    key={p.itemId}
                    href={`/account/orders/${p.orderId}/proof/${p.itemId}`}
                    className="flex items-center justify-between rounded-lg border border-[rgba(255,193,7,0.3)] bg-white/60 px-3 py-2.5 transition hover:bg-white"
                  >
                    <p className="text-xs font-semibold text-brand-text">{p.orderNumber}</p>
                    <span className="text-xs font-medium text-brand-primary">Review →</span>
                  </Link>
                ))}
              </div>
              {proofOrders.length > 4 && (
                <Link
                  href="/account/proofs"
                  className="mt-2 block text-center text-xs font-medium"
                  style={{ color: '#7a5c00' }}
                >
                  +{proofOrders.length - 4} more — View all proofs
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
