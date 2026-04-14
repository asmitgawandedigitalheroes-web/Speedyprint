'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import type { Proof } from '@/types'
import { cn } from '@/lib/utils'

/* ─── Brand-safe proof status config ─── */
interface StatusCfg {
  label:     string
  bg:        string
  text:      string
  border:    string
  icon:      React.ElementType
}

const PROOF_STATUS: Record<string, StatusCfg> = {
  pending: {
    label:  'Awaiting Review',
    bg:     'bg-amber-50',
    text:   'text-amber-700',
    border: 'border-amber-200',
    icon:   Clock,
  },
  approved: {
    label:  'Approved',
    bg:     'bg-green-50',
    text:   'text-green-700',
    border: 'border-green-200',
    icon:   CheckCircle2,
  },
  revision_requested: {
    label:  'Revision Requested',
    bg:     'bg-brand-primary/5',
    text:   'text-brand-primary-dark',
    border: 'border-brand-primary/20',
    icon:   RefreshCw,
  },
  rejected: {
    label:  'Rejected',
    bg:     'bg-red-50',
    text:   'text-red-700',
    border: 'border-red-200',
    icon:   AlertCircle,
  },
}

interface ProofWithContext extends Proof {
  orderId:     string
  orderNumber: string
  itemId:      string
}

export default function ProofsPage() {
  const { user } = useAuth()
  const [proofs,   setProofs]   = useState<ProofWithContext[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<'pending' | 'all'>('pending')

  async function fetchProofs() {
    if (!user) return
    setLoading(true)
    const supabase = createClient()

    /* Step 1: get user's orders */
    const { data: userOrders } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('user_id', user.id)

    if (!userOrders || userOrders.length === 0) { setLoading(false); return }

    const orderMap = Object.fromEntries(userOrders.map((o: any) => [o.id, o.order_number]))
    const orderIds = userOrders.map((o: any) => o.id)

    /* Step 2: get order_items for these orders */
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id, order_id')
      .in('order_id', orderIds)

    if (!orderItems || orderItems.length === 0) { setLoading(false); return }

    const itemMap = Object.fromEntries(
      orderItems.map((i: any) => [i.id, { orderId: i.order_id, orderNumber: orderMap[i.order_id] }])
    )
    const itemIds = orderItems.map((i: any) => i.id)

    /* Step 3: get proofs for those items */
    const { data: proofData } = await supabase
      .from('proofs')
      .select('*')
      .in('order_item_id', itemIds)
      .order('created_at', { ascending: false })

    const enriched: ProofWithContext[] = (proofData ?? []).map((p: any) => ({
      ...p,
      itemId:      p.order_item_id,
      orderId:     itemMap[p.order_item_id]?.orderId     ?? '',
      orderNumber: itemMap[p.order_item_id]?.orderNumber ?? 'Unknown',
    }))

    setProofs(enriched)
    setLoading(false)
  }

  useEffect(() => { fetchProofs() }, [user])

  const pendingProofs = proofs.filter((p) => p.status === 'pending')
  const displayed     = tab === 'pending' ? pendingProofs : proofs

  return (
    <div className="p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">Account</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-brand-text">Proofs</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Review and approve design proofs before production begins.
        </p>
      </div>

      {/* ── Tabs + Refresh ── */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex gap-1 rounded-lg border border-[#E7E5E4] bg-white p-1">
          {[
            { label: `Pending Review${pendingProofs.length > 0 ? ` (${pendingProofs.length})` : ''}`, value: 'pending' as const },
            { label: `All Proofs (${proofs.length})`, value: 'all' as const },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                tab === t.value
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchProofs}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-text-muted transition hover:text-brand-primary"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-[#E7E5E4] bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F6F7]">
            <ShieldCheck className="h-6 w-6 text-brand-text-muted" />
          </div>
          {tab === 'pending' ? (
            <>
              <p className="font-heading text-base font-semibold text-brand-text">
                No proofs awaiting review
              </p>
              <p className="mt-1 text-sm text-brand-text-muted">
                You&apos;re all caught up! We&apos;ll email you when a new proof is ready.
              </p>
              <button
                onClick={() => setTab('all')}
                className="mt-4 text-sm font-medium text-brand-primary hover:underline"
              >
                View all proof history
              </button>
            </>
          ) : (
            <>
              <p className="font-heading text-base font-semibold text-brand-text">No proofs yet</p>
              <p className="mt-1 text-sm text-brand-text-muted">
                Proofs will appear here once our team prepares them for your order.
              </p>
              <Link
                href="/order-now"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                Place an Order <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((proof) => {
            const cfg  = PROOF_STATUS[proof.status] ?? PROOF_STATUS['pending']
            const Icon = cfg.icon
            return (
              <div
                key={proof.id}
                className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
                style={{ borderColor: proof.status === 'pending' ? cfg.border : '#E7E5E4' }}
              >
                {/* Thumbnail */}
                <div className="relative h-36 bg-[#F5F6F7]">
                  {proof.proof_thumbnail_url ? (
                    <img
                      src={proof.proof_thumbnail_url}
                      alt=""
                      className="h-full w-full object-contain p-3"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const fallback = target.nextElementSibling as HTMLElement | null
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div
                    className="h-full items-center justify-center"
                    style={{ display: proof.proof_thumbnail_url ? 'none' : 'flex' }}
                  >
                    <ShieldCheck className="h-10 w-10 text-[#D0D0D0]" />
                  </div>

                  {/* Version badge */}
                  <span className="absolute left-3 top-3 rounded bg-brand-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                    v{proof.version}
                  </span>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-text">
                        {proof.orderNumber}
                      </p>
                      <p className="text-xs text-brand-text-muted">
                        {formatDate(proof.created_at)}
                      </p>
                    </div>
                    <span
                      className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: cfg.bg, color: cfg.text }}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>

                  {proof.customer_notes && (
                    <p className="mb-3 rounded bg-[#F5F6F7] px-2 py-1.5 text-xs text-brand-text-muted italic line-clamp-2">
                      &ldquo;{proof.customer_notes}&rdquo;
                    </p>
                  )}

                  {proof.status === 'pending' ? (
                    <Link
                      href={`/account/orders/${proof.orderId}/proof/${proof.itemId}`}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-primary-dark"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Review &amp; Approve
                    </Link>
                  ) : (
                    <Link
                      href={`/account/orders/${proof.orderId}/proof/${proof.itemId}`}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E7E5E4] px-3 py-2 text-xs font-medium text-brand-text-muted transition hover:border-brand-primary hover:text-brand-primary"
                    >
                      View Proof
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
