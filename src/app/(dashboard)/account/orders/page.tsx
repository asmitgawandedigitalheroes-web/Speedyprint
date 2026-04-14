'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { toast } from 'sonner'
import {
  ArrowRight, Search, ShoppingBag, ChevronRight, ShieldCheck,
  CreditCard, Loader2, Trash2, XCircle, LifeBuoy, PlayCircle,
  Package, CheckCircle2, Clock, Truck, RefreshCw, History,
  Zap, TrendingUp, X,
} from 'lucide-react'
import type { Order } from '@/types'
import { cn } from '@/lib/utils'

type ProofMap = Record<string, string>

/* ── Status config ─────────────────────────────────────────────────────── */
const STATUS_CFG: Record<string, {
  label: string; dot: string; badge: string; text: string; step: number
}> = {
  draft:           { label: 'Draft',           dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600 border-gray-200',         text: '#555',    step: 0 },
  pending_payment: { label: 'Pending Payment', dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',       text: '#92400e', step: 1 },
  paid:            { label: 'Paid',            dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200',       text: '#15803d', step: 2 },
  in_production:   { label: 'In Production',   dot: 'bg-brand-primary',  badge: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',     text: 'var(--color-brand-primary-dark)', step: 3 },
  completed:       { label: 'Completed',       dot: 'bg-slate-500',  badge: 'bg-slate-100 text-slate-700 border-slate-200',      text: '#334155', step: 4 },
  cancelled:       { label: 'Cancelled',       dot: 'bg-red-400',    badge: 'bg-red-50 text-red-600 border-red-100',             text: '#dc2626', step: -1 },
}

const PROGRESS_STEPS = [
  { key: 'pending_payment', icon: CreditCard,    label: 'Payment'    },
  { key: 'paid',            icon: CheckCircle2,  label: 'Confirmed'  },
  { key: 'in_production',   icon: Zap,           label: 'Production' },
  { key: 'completed',       icon: Truck,         label: 'Delivered'  },
]

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CFG[status] ?? { label: status, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', s.badge)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

const ACTIVE_STATUSES  = new Set(['draft', 'pending_payment', 'paid', 'in_production'])
const PAST_STATUSES    = new Set(['completed', 'cancelled'])

const FILTER_TABS = [
  { label: 'All',       value: 'all'       },
  { label: 'Active',    value: 'active'    },
  { label: 'Pending',   value: 'pending'   },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default function OrdersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [orders,   setOrders]   = useState<Order[]>([])
  const [proofMap, setProofMap] = useState<ProofMap>({})
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('all')
  const [search,   setSearch]   = useState('')
  const [payingId, setPayingId] = useState<string | null>(null)

  /* ── Fetch ── */
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, status, total, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      const list = (data as Order[]) || []
      setOrders(list)

      if (list.length > 0) {
        const ids = list.map((o) => o.id)
        const { data: items } = await supabase
          .from('order_items')
          .select('id, order_id')
          .in('order_id', ids)
          .eq('status', 'proof_sent')
        const map: ProofMap = {}
        for (const item of items ?? []) {
          if (!map[item.order_id]) map[item.order_id] = item.id
        }
        setProofMap(map)
      }
      setLoading(false)
    }
    load()
  }, [user])

  /* ── Handlers ── */
  const handlePay = async (orderId: string) => {
    setPayingId(orderId)
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url }
      else throw new Error(data.error || 'Failed')
    } catch (err: any) {
      toast.error(err.message || 'Payment failed. Please try again.')
    } finally {
      setPayingId(null)
    }
  }

  const handleCancel = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to cancel'); return }
      toast.success('Order cancelled')
      setOrders((p) => p.map((o) => o.id === orderId ? { ...o, status: 'cancelled' as any } : o))
    } catch { toast.error('Failed to cancel order.') }
  }

  const handleDelete = async (orderId: string) => {
    if (!confirm('Remove this draft? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to remove draft'); return }
      toast.success('Draft removed')
      setOrders((p) => p.filter((o) => o.id !== orderId))
    } catch { toast.error('Failed to remove draft.') }
  }

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    let list = orders
    if      (tab === 'active')    list = list.filter((o) => ACTIVE_STATUSES.has(o.status))
    else if (tab === 'pending')   list = list.filter((o) => o.status === 'pending_payment' || o.status === 'draft')
    else if (tab === 'completed') list = list.filter((o) => o.status === 'completed')
    else if (tab === 'cancelled') list = list.filter((o) => o.status === 'cancelled')
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((o) => o.order_number?.toLowerCase().includes(q) || o.status?.toLowerCase().includes(q))
    }
    return list
  }, [orders, tab, search])

  const activeOrders = useMemo(() => filtered.filter((o) => ACTIVE_STATUSES.has(o.status)), [filtered])
  const pastOrders   = useMemo(() => filtered.filter((o) => PAST_STATUSES.has(o.status)),   [filtered])

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total:     orders.length,
    active:    orders.filter((o) => ACTIVE_STATUSES.has(o.status)).length,
    completed: orders.filter((o) => o.status === 'completed').length,
    spent:     orders.filter((o) => o.status !== 'cancelled' && o.status !== 'draft').reduce((s, o) => s + (o.total ?? 0), 0),
  }), [orders])

  /* ── Reorder ── */
  const handleReorder = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Reorder failed'); return }
      toast.success('Draft created — review and checkout')
      router.push(`/account/orders/${data.order.id}`)
    } catch { toast.error('Reorder failed.') }
  }

  /* ──────────────────────────────────────────────────────────────────────
     Render helpers
  ────────────────────────────────────────────────────────────────────── */

  /* Active order card with progress bar */
  function ActiveCard({ order }: { order: Order }) {
    const proofItemId = proofMap[order.id]
    const step = STATUS_CFG[order.status]?.step ?? 0
    const showProgress = !['draft', 'cancelled'].includes(order.status)

    return (
      <div
        onClick={() => router.push(`/account/orders/${order.id}`)}
        className="group cursor-pointer rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
      >
        {/* Proof alert banner */}
        {proofItemId && (
          <div className="rounded-t-2xl bg-amber-400 px-5 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <ShieldCheck className="h-4 w-4" />
                Proof ready — your approval is needed
              </div>
              <Link
                href={`/account/orders/${order.id}/proof/${proofItemId}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg bg-amber-900/15 px-3 py-1 text-xs font-bold text-amber-900 transition hover:bg-amber-900/25"
              >
                Review Proof →
              </Link>
            </div>
          </div>
        )}

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <p className="text-base font-bold text-gray-900 group-hover:text-brand-primary transition-colors">
                  {order.order_number}
                </p>
                <StatusBadge status={order.status} />
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{formatDate(order.created_at)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-gray-900">{formatCurrency(order.total)}</p>
            </div>
          </div>

          {/* Progress stepper */}
          {showProgress && (
            <div className="mt-4 flex items-center gap-0">
              {PROGRESS_STEPS.map((s, idx) => {
                const stepVal = STATUS_CFG[s.key]?.step ?? 0
                const done    = step > stepVal
                const current = STATUS_CFG[order.status]?.step === (idx + 1)
                const stepNum = idx + 1
                const active  = step >= stepNum

                // map step index
                const stepMap: Record<string, number> = {
                  pending_payment: 1, paid: 2, in_production: 3, completed: 4,
                }
                const orderStep = stepMap[order.status] ?? 0
                const isFilled  = orderStep >= stepNum
                const isCurrent = orderStep === stepNum

                return (
                  <div key={s.key} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
                        isFilled
                          ? 'border-brand-primary bg-brand-primary text-white'
                          : 'border-gray-200 bg-white text-gray-400'
                      )}>
                        <s.icon className="h-3.5 w-3.5" />
                      </div>
                      <p className={cn(
                        'mt-1 text-center text-[10px] font-medium leading-tight',
                        isFilled ? 'text-brand-primary' : 'text-gray-400'
                      )}>
                        {s.label}
                      </p>
                    </div>
                    {idx < PROGRESS_STEPS.length - 1 && (
                      <div className={cn(
                        'mb-4 flex-1 border-t-2 transition-all',
                        orderStep > stepNum ? 'border-brand-primary' : 'border-gray-200'
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Action buttons */}
          <div
            className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            {order.status === 'draft' && (
              <>
                <button
                  onClick={() => handlePay(order.id)}
                  disabled={payingId === order.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
                >
                  {payingId === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                  Resume & Pay
                </button>
                <button
                  onClick={() => handleDelete(order.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove Draft
                </button>
              </>
            )}

            {order.status === 'pending_payment' && (
              <>
                <button
                  onClick={() => handlePay(order.id)}
                  disabled={payingId === order.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
                >
                  {payingId === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                  Complete Payment
                </button>
                <button
                  onClick={() => handleCancel(order.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            )}

            {order.status === 'paid' && (
              <button
                onClick={() => handleCancel(order.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
              >
                <XCircle className="h-3.5 w-3.5" /> Cancel Order
              </button>
            )}

            {order.status === 'in_production' && (
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
              >
                <LifeBuoy className="h-3.5 w-3.5" /> Need Help?
              </Link>
            )}

            <Link
              href={`/account/orders/${order.id}`}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-gray-400 transition hover:text-gray-700"
            >
              View details <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* Past order row */
  function PastRow({ order }: { order: Order }) {
    const isCompleted = order.status === 'completed'
    return (
      <div
        onClick={() => router.push(`/account/orders/${order.id}`)}
        className="group flex cursor-pointer items-center gap-4 px-5 py-3.5 transition hover:bg-gray-50"
      >
        {/* Icon */}
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          isCompleted ? 'bg-green-50' : 'bg-red-50'
        )}>
          {isCompleted
            ? <CheckCircle2 className="h-4 w-4 text-green-600" />
            : <XCircle className="h-4 w-4 text-red-500" />
          }
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-primary transition-colors">
            {order.order_number}
          </p>
          <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
        </div>

        {/* Total */}
        <p className="shrink-0 text-sm font-semibold text-gray-700">{formatCurrency(order.total)}</p>

        {/* Status */}
        <div className="hidden shrink-0 sm:block">
          <StatusBadge status={order.status} />
        </div>

        {/* Reorder */}
        {isCompleted && (
          <button
            onClick={(e) => handleReorder(e, order.id)}
            className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 sm:inline-flex"
          >
            <RefreshCw className="h-3 w-3" /> Reorder
          </button>
        )}

        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-gray-500" />
      </div>
    )
  }

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-7 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="mb-5 grid grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />)}
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white" />)}
        </div>
      </div>
    )
  }

  /* ── Empty ── */
  const isEmpty = orders.length === 0

  return (
    <div className="p-6 lg:p-8">

      {/* ── Page Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Account</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Track, review, and reorder your past orders.</p>
        </div>
        <Link
          href="/order-now"
          className="hidden shrink-0 items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-dark sm:inline-flex"
        >
          <Package className="h-4 w-4" /> New Order
        </Link>
      </div>

      {isEmpty ? (
        /* ── Zero state ── */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <ShoppingBag className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-800">No orders yet</h2>
          <p className="mt-1.5 text-sm text-gray-500">Place your first order and it'll show up here.</p>
          <Link
            href="/order-now"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            Browse Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* ── Stats Strip ── */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Orders',    value: stats.total,                    icon: Package,       color: 'text-gray-700',  bg: 'bg-gray-100'  },
              { label: 'Active',          value: stats.active,                   icon: Zap,           color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
              { label: 'Completed',       value: stats.completed,                icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-green-50'  },
              { label: 'Total Spent',     value: formatCurrency(stats.spent),    icon: TrendingUp,    color: 'text-blue-600',  bg: 'bg-blue-50'   },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', s.bg)}>
                  <s.icon className={cn('h-4 w-4', s.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-base font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filter Bar ── */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTER_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={cn(
                    'shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
                    tab === t.value ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search order #…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-800 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
              <p className="mt-3 font-semibold text-gray-500">No matching orders</p>
              <button
                onClick={() => { setTab('all'); setSearch('') }}
                className="mt-3 text-sm font-medium text-brand-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">

              {/* ── Active Orders ── */}
              {activeOrders.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary">
                      <Zap className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">
                      Active Orders
                    </h2>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-primary px-1.5 text-[10px] font-bold text-white">
                      {activeOrders.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {activeOrders.map((o) => <ActiveCard key={o.id} order={o} />)}
                  </div>
                </section>
              )}

              {/* ── Past Orders ── */}
              {pastOrders.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">
                      <History className="h-3.5 w-3.5 text-gray-600" />
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                      Order History
                    </h2>
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-200 px-1.5 text-[10px] font-bold text-gray-600">
                      {pastOrders.length}
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="divide-y divide-gray-100">
                      {pastOrders.map((o) => <PastRow key={o.id} order={o} />)}
                    </div>
                    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
                      <p className="text-xs text-gray-400">
                        {pastOrders.length} past order{pastOrders.length !== 1 ? 's' : ''} · Click any row to view full details
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* If showing all tab and only one type of orders — no section label needed, footer count */}
              {(tab !== 'all' || search) && activeOrders.length === 0 && pastOrders.length === 0 && (
                <p className="text-center text-sm text-gray-400">No orders match your filter.</p>
              )}

            </div>
          )}
        </>
      )}
    </div>
  )
}
