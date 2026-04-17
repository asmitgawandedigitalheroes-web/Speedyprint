'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search, Package, ArrowRight, Loader2, AlertCircle, CheckCircle2,
  Truck, Clock, MapPin, ExternalLink, CreditCard, Palette, Eye,
  Factory, Box, PackageCheck, XCircle, ChevronRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Package }> = {
  pending_payment:      { label: 'Awaiting payment',        color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  icon: CreditCard },
  paid:                 { label: 'Payment confirmed',        color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   icon: CheckCircle2 },
  pending_design:       { label: 'Artwork review',           color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   icon: Palette },
  proof_pending_review: { label: 'Proof ready for review',  color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  icon: Eye },
  in_production:        { label: 'In production',            color: 'text-purple-700', bg: 'bg-purple-50',  border: 'border-purple-200', icon: Factory },
  ready_to_ship:        { label: 'Ready to ship',            color: 'text-sky-700',    bg: 'bg-sky-50',     border: 'border-sky-200',    icon: Box },
  shipped:              { label: 'Dispatched',               color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200',  icon: Truck },
  delivered:            { label: 'Delivered',                color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-300',icon: PackageCheck },
  completed:            { label: 'Completed',                color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-300',icon: CheckCircle2 },
  cancelled:            { label: 'Cancelled',                color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200',    icon: XCircle },
}

// Order stages shown in the progress stepper (excludes cancelled)
const ORDER_STAGES = [
  'pending_payment',
  'paid',
  'pending_design',
  'proof_pending_review',
  'in_production',
  'ready_to_ship',
  'shipped',
  'delivered',
]

// ─── Types ────────────────────────────────────────────────────────────────────

type TrackingEvent = {
  id: number
  date: string
  status: string
  location?: string
  message?: string
}

type OrderResult = {
  id: string
  status: string
  created_at: string
  total: number
  tracking_number?: string
  tracking_url?: string
  courier_status?: string
  tracking_events: TrackingEvent[]
  items: { product_name: string; quantity: number; unit_price: number }[]
}

// ─── Progress stepper ─────────────────────────────────────────────────────────

function OrderStepper({ status }: { status: string }) {
  if (status === 'cancelled') return null

  const currentIndex = ORDER_STAGES.indexOf(status)

  // Compact labels for the stepper
  const STEP_LABELS: Record<string, string> = {
    pending_payment:      'Payment',
    paid:                 'Confirmed',
    pending_design:       'Artwork',
    proof_pending_review: 'Proof',
    in_production:        'Production',
    ready_to_ship:        'Ready',
    shipped:              'Dispatched',
    delivered:            'Delivered',
  }

  const STEP_ICONS: Record<string, typeof Package> = {
    pending_payment:      CreditCard,
    paid:                 CheckCircle2,
    pending_design:       Palette,
    proof_pending_review: Eye,
    in_production:        Factory,
    ready_to_ship:        Box,
    shipped:              Truck,
    delivered:            PackageCheck,
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-start gap-0">
        {ORDER_STAGES.map((stage, i) => {
          const isCompleted = i < currentIndex
          const isCurrent   = i === currentIndex
          const Icon        = STEP_ICONS[stage]
          const isLast      = i === ORDER_STAGES.length - 1

          return (
            <div key={stage} className="flex items-start">
              {/* Step */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                    isCompleted
                      ? 'border-brand-primary bg-brand-primary text-white'
                      : isCurrent
                      ? 'border-brand-primary bg-white text-brand-primary shadow-sm shadow-brand-primary/20'
                      : 'border-gray-200 bg-gray-50 text-gray-300'
                  }`}
                >
                  {isCompleted
                    ? <CheckCircle2 className="h-4 w-4" />
                    : <Icon className="h-3.5 w-3.5" />
                  }
                </div>
                <span
                  className={`text-center text-[10px] font-medium leading-tight ${
                    isCurrent
                      ? 'text-brand-primary'
                      : isCompleted
                      ? 'text-brand-text-muted'
                      : 'text-gray-300'
                  }`}
                  style={{ width: '3.5rem' }}
                >
                  {STEP_LABELS[stage]}
                </span>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className={`mt-3.5 h-0.5 w-8 ${i < currentIndex ? 'bg-brand-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email,       setEmail]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [result,      setResult]      = useState<OrderResult | null>(null)
  const [notFound,    setNotFound]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setNotFound(false)

    try {
      const res = await fetch(
        `/api/orders/track?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`
      )
      if (res.status === 404) { setNotFound(true); return }
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResult(data.order)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const statusInfo = result
    ? (STATUS_CONFIG[result.status] ?? { label: result.status, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', icon: Package })
    : null

  return (
    <div className="min-h-screen bg-brand-bg">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-brand-secondary">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)',
          }}
        />
        {/* Accent glow */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-primary opacity-10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/20 ring-1 ring-brand-primary/30">
            <Package className="h-7 w-7 text-brand-primary" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">Track your order</h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/60">
            Enter your order number and email to get real-time status updates and live courier tracking.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">

        {/* ── Lookup form ── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-brand-text">Find your order</h2>
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label htmlFor="order" className="mb-1.5 block text-sm font-medium text-brand-text">
                Order number <span className="text-brand-primary">*</span>
              </label>
              <div className="relative">
                <Package className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="order"
                  type="text"
                  required
                  placeholder="e.g. ORD-ABC123"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-brand-text placeholder-gray-400 transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/10 disabled:opacity-50"
                />
              </div>
              <p className="mt-1.5 text-xs text-brand-text-muted">Found in your order confirmation email.</p>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-brand-text">
                Email address <span className="text-brand-primary">*</span>
              </label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="The email you used when ordering"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-brand-text placeholder-gray-400 transition focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/10 disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching…</>
                : <><Search className="h-4 w-4" /> Track My Order</>
              }
            </button>
          </form>
        </div>

        {/* ── Not found ── */}
        {notFound && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Order not found</h3>
                <p className="mt-1 text-sm text-red-700">
                  We couldn&apos;t find an order matching those details. Double-check your order number and email address.
                </p>
                <Link href="/contact" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-red-700 underline underline-offset-2">
                  Contact support <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Order result ── */}
        {result && statusInfo && (
          <div className="mt-6 space-y-4">

            {/* Status header card */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              {/* Coloured top band */}
              <div className={`px-6 py-4 ${statusInfo.bg} ${statusInfo.border} border-b`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${statusInfo.border} bg-white`}>
                      <statusInfo.icon className={`h-4.5 w-4.5 ${statusInfo.color}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
                      <p className="text-xs text-brand-text-muted">Current status</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs font-semibold text-brand-text">{result.id}</p>
                    <p className="text-xs text-brand-text-muted">
                      {new Date(result.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress stepper */}
              {result.status !== 'cancelled' && (
                <div className="border-b border-gray-100 px-6 py-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-text-muted">Order progress</p>
                  <OrderStepper status={result.status} />
                </div>
              )}

              {/* Items */}
              <div className="px-6 py-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-text-muted">Items</p>
                <ul className="divide-y divide-gray-50">
                  {result.items.map((item, i) => (
                    <li key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100">
                          <Package className="h-3.5 w-3.5 text-gray-400" />
                        </div>
                        <span className="text-sm text-brand-text">{item.product_name}</span>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-brand-text-muted">×{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4">
                <p className="text-sm font-bold text-brand-text">
                  Total <span className="text-brand-primary">{formatCurrency(result.total)}</span>
                </p>
                <Link href="/contact" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary underline underline-offset-2">
                  Need help? <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Proof pending CTA */}
            {result.status === 'proof_pending_review' && (
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/60 p-5">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200/60">
                    <Eye className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800">Your proof is ready to review</p>
                    <p className="mt-1 text-sm text-amber-700">
                      Log in to approve your artwork or request changes before we start production.
                    </p>
                    <Link
                      href="/login"
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
                    >
                      Log in to review proof <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Live courier tracking */}
            {result.tracking_number && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10">
                      <Truck className="h-4 w-4 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-brand-text">Live Courier Tracking</h3>
                      {result.courier_status && (
                        <p className="text-xs text-brand-text-muted">{result.courier_status}</p>
                      )}
                    </div>
                  </div>
                  {result.tracking_url && (
                    <a
                      href={result.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-brand-text transition hover:bg-gray-100"
                    >
                      Bob Go <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="px-6 py-1 pb-2">
                  <p className="py-2 font-mono text-xs text-brand-text-muted">
                    Ref: <span className="text-brand-text">{result.tracking_number}</span>
                  </p>
                </div>

                <div className="px-6 pb-6">
                  {result.tracking_events.length > 0 ? (
                    <ol className="space-y-0">
                      {result.tracking_events.map((evt, i) => {
                        const isFirst = i === 0
                        const isLast  = i === result.tracking_events.length - 1
                        return (
                          <li key={evt.id ?? i} className="relative flex gap-4">
                            {/* Timeline rail */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                                  isFirst
                                    ? 'border-brand-primary bg-brand-primary text-white'
                                    : 'border-gray-200 bg-white text-gray-400'
                                }`}
                              >
                                {isFirst
                                  ? <Truck className="h-3.5 w-3.5" />
                                  : <div className="h-2 w-2 rounded-full bg-gray-300" />
                                }
                              </div>
                              {!isLast && <div className="my-1 w-px flex-1 bg-gray-200" style={{ minHeight: '1.5rem' }} />}
                            </div>

                            {/* Content */}
                            <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                              <p className={`text-sm font-semibold ${isFirst ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                                {evt.status}
                              </p>
                              {evt.message && (
                                <p className="mt-0.5 text-xs text-brand-text-muted">{evt.message}</p>
                              )}
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-brand-text-muted">
                                {evt.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {evt.location}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(evt.date).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                      <Truck className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium text-brand-text-muted">Awaiting first scan</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Tracking events will appear once the courier collects your parcel.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Account CTA ── */}
        <div className="mt-8 flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10">
              <Package className="h-4.5 w-4.5 text-brand-primary" />
            </div>
            <p className="text-sm text-brand-text-muted">
              Have an account? View all your orders.
            </p>
          </div>
          <Link
            href="/account/orders"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-secondary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-secondary/90"
          >
            My orders <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>
    </div>
  )
}
