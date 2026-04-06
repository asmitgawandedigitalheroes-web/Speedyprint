'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { ArrowRight, Search, ShoppingBag, ChevronRight, ShieldCheck } from 'lucide-react'
import type { Order, OrderStatus } from '@/types'

/* Map orderId → first proof_sent itemId */
type ProofMap = Record<string, string>

/* ─── Brand-safe status config ─── */
const ORDER_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  draft:           { label: 'Draft',           bg: 'rgba(224,224,224,0.9)', text: '#555' },
  pending_payment: { label: 'Pending Payment', bg: 'rgba(255,193,7,0.18)',  text: '#7a5c00' },
  paid:            { label: 'Paid',            bg: 'rgba(30,41,59,0.12)',   text: '#1E293B' },
  in_production:   { label: 'In Production',   bg: 'rgba(227,6,19,0.12)',   text: '#c00510' },
  completed:       { label: 'Completed',       bg: 'rgba(30,41,59,0.18)',   text: '#1E293B' },
  cancelled:       { label: 'Cancelled',       bg: 'rgba(227,6,19,0.08)',   text: '#E30613' },
}

function StatusBadge({ status }: { status: string }) {
  const s = ORDER_BADGE[status] ?? { label: status, bg: '#E0E0E0', text: '#333' }
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

const FILTER_TABS: { label: string; value: string }[] = [
  { label: 'All',          value: 'all'           },
  { label: 'Active',       value: 'active'        },
  { label: 'Pending',      value: 'pending'       },
  { label: 'Completed',    value: 'completed'     },
  { label: 'Cancelled',    value: 'cancelled'     },
]

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders,   setOrders]   = useState<Order[]>([])
  const [proofMap, setProofMap] = useState<ProofMap>({})
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('all')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    async function fetchOrders() {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, status, total, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      const orderList = (data as Order[]) || []
      setOrders(orderList)

      /* Fetch which orders have a proof_sent item so we can show inline CTA */
      if (orderList.length > 0) {
        const ids = orderList.map((o: Order) => o.id)
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

    fetchOrders()
  }, [user])

  const filtered = useMemo(() => {
    let list = orders

    /* Tab filter */
    if (tab === 'active')    list = list.filter((o) => o.status === 'paid' || o.status === 'in_production')
    else if (tab === 'pending')   list = list.filter((o) => o.status === 'pending_payment' || o.status === 'draft')
    else if (tab === 'completed') list = list.filter((o) => o.status === 'completed')
    else if (tab === 'cancelled') list = list.filter((o) => o.status === 'cancelled')

    /* Search */
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((o) =>
        o.order_number?.toLowerCase().includes(q) ||
        o.status?.toLowerCase().includes(q)
      )
    }

    return list
  }, [orders, tab, search])

  return (
    <div className="p-6 lg:p-8">

      {/* ── Page header ── */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">Account</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-brand-text">My Orders</h1>
        <p className="mt-1 text-sm text-brand-text-muted">Track, review, and reorder your past orders.</p>
      </div>

      {/* ── Filter bar ── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-[#E7E5E4] bg-white p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTER_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              style={
                tab === t.value
                  ? { backgroundColor: '#E30613', color: '#ffffff' }
                  : { color: '#64748B' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-text-muted" />
          <input
            type="text"
            placeholder="Search order #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E7E5E4] bg-white py-2 pl-9 pr-3 text-sm text-brand-text placeholder:text-brand-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
          />
        </div>
      </div>

      {/* ── Orders list ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#E7E5E4] bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F6F7]">
            <ShoppingBag className="h-6 w-6 text-brand-text-muted" />
          </div>
          {orders.length === 0 ? (
            <>
              <p className="font-heading text-base font-semibold text-brand-text">No orders yet</p>
              <p className="mt-1 text-sm text-brand-text-muted">
                Place your first order to get started.
              </p>
              <Link
                href="/order-now"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                Browse Products <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="font-heading text-base font-semibold text-brand-text">No matching orders</p>
              <p className="mt-1 text-sm text-brand-text-muted">Try a different filter or search term.</p>
              <button
                onClick={() => { setTab('all'); setSearch('') }}
                className="mt-4 text-sm font-medium text-brand-primary hover:underline"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E7E5E4] bg-white shadow-sm">
          {/* Table header — desktop */}
          <div className="hidden border-b border-[#F0F0F0] bg-[#FAFAFA] px-6 py-3 sm:grid sm:grid-cols-[1fr_140px_100px_120px_140px_44px] sm:gap-4">
            {['Order', 'Date', 'Total', 'Status', '', ''].map((h, i) => (
              <p key={i} className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">
                {h}
              </p>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#F0F0F0]">
            {filtered.map((order) => {
              const proofItemId = proofMap[order.id]
              return (
                <div key={order.id} className="group relative">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex flex-col gap-2 px-6 py-4 transition hover:bg-[#FAFAFA] sm:grid sm:grid-cols-[1fr_140px_100px_120px_140px_44px] sm:items-center sm:gap-4"
                  >
                    {/* Order # */}
                    <div>
                      <p className="text-sm font-semibold text-brand-text transition group-hover:text-brand-primary">
                        {order.order_number}
                      </p>
                      <p className="mt-0.5 text-xs text-brand-text-muted sm:hidden">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    {/* Date */}
                    <p className="hidden text-sm text-brand-text-muted sm:block">
                      {formatDate(order.created_at)}
                    </p>
                    {/* Total */}
                    <p className="text-sm font-semibold text-brand-text">
                      {formatCurrency(order.total)}
                    </p>
                    {/* Status badge */}
                    <StatusBadge status={order.status} />
                    {/* Proof CTA — only when a proof_sent item exists */}
                    {proofItemId && (
                      <span
                        onClick={(e) => e.stopPropagation()}
                        className="hidden sm:block"
                      >
                        <Link
                          href={`/account/orders/${order.id}/proof/${proofItemId}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                          style={{ background: '#FFC107', color: '#1a1a2e' }}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Approve Proof
                        </Link>
                      </span>
                    )}
                    {/* Arrow */}
                    <ChevronRight className="hidden h-4 w-4 text-brand-text-muted transition group-hover:text-brand-primary sm:block" />
                  </Link>
                  {/* Mobile proof CTA */}
                  {proofItemId && (
                    <div className="px-6 pb-3 sm:hidden">
                      <Link
                        href={`/account/orders/${order.id}/proof/${proofItemId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-90"
                        style={{ background: '#FFC107', color: '#1a1a2e' }}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Approve Proof
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer count */}
          <div className="border-t border-[#F0F0F0] px-6 py-3">
            <p className="text-xs text-brand-text-muted">
              Showing {filtered.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
