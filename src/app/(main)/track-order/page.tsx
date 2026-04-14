'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Package, ArrowRight, Loader2, AlertCircle, CheckCircle2, Truck, Clock } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'

// Status display config
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending_payment: { label: 'Awaiting payment', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  paid: { label: 'Payment confirmed', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: CheckCircle2 },
  pending_design: { label: 'Artwork review', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Clock },
  proof_pending_review: { label: 'Proof ready for review', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  in_production: { label: 'In production', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: Package },
  ready_to_ship: { label: 'Ready to ship', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Package },
  shipped: { label: 'Dispatched', color: 'text-green-600 bg-green-50 border-green-200', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-green-700 bg-green-100 border-green-300', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'text-green-700 bg-green-100 border-green-300', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertCircle },
}

type OrderResult = {
  id: string
  status: string
  created_at: string
  total_amount: number
  tracking_number?: string
  courier?: string
  items: { product_name: string; quantity: number }[]
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OrderResult | null>(null)
  const [notFound, setNotFound] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setNotFound(false)

    try {
      const res = await fetch(`/api/orders/track?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResult(data.order)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const statusInfo = result ? (STATUS_CONFIG[result.status] ?? { label: result.status, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Package }) : null

  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Header */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-white">Track your order</h1>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Enter your order number and email address to see your current order status and tracking information.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Lookup form */}
        <div className="rounded-md border border-gray-100 bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="order" className="mb-1.5 block text-sm font-medium text-brand-text">
                Order number <span className="text-red-500">*</span>
              </label>
              <input
                id="order"
                type="text"
                required
                placeholder="e.g. SP-2024-00123"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                disabled={loading}
                className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-brand-text-muted">
                Your order number is in your confirmation email.
              </p>
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-brand-text">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="The email used when ordering"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Searching…</>
              ) : (
                <><Search className="h-4 w-4" /> Track My Order</>
              )}
            </button>
          </form>
        </div>

        {/* Not found */}
        {notFound && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <h3 className="mt-3 font-heading text-base font-semibold text-brand-text">Order not found</h3>
            <p className="mt-1 text-sm text-brand-text-muted">
              We couldn&apos;t find an order matching those details. Please check your order number and email address.
            </p>
            <p className="mt-3 text-sm text-brand-text-muted">
              Need help?{' '}
              <Link href="/contact" className="font-semibold text-brand-primary underline underline-offset-2">
                Contact us
              </Link>
              {' '}and we&apos;ll look it up for you.
            </p>
          </div>
        )}

        {/* Order result */}
        {result && statusInfo && (
          <div className="mt-6 rounded-md border border-gray-100 bg-white p-8 space-y-6">
            {/* Status badge */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">Order {result.id}</p>
                <p className="mt-0.5 text-xs text-brand-text-muted">
                  Placed {new Date(result.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.color}`}>
                <statusInfo.icon className="h-3.5 w-3.5" />
                {statusInfo.label}
              </span>
            </div>

            {/* Order items */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-brand-text">Items</h3>
              <ul className="space-y-1.5">
                {result.items.map((item, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-brand-text">{item.product_name}</span>
                    <span className="text-brand-text-muted">×{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tracking */}
            {result.tracking_number && (
              <div className="rounded-md border border-gray-100 bg-brand-bg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-brand-primary" />
                  <p className="text-sm font-semibold text-brand-text">Tracking</p>
                </div>
                <p className="text-sm text-brand-text-muted">
                  {result.courier && <span className="mr-2 font-medium">{result.courier}</span>}
                  <span className="font-mono text-brand-text">{result.tracking_number}</span>
                </p>
              </div>
            )}

            {/* Proof pending call to action */}
            {result.status === 'proof_pending_review' && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">Your proof is ready to review</p>
                <p className="mt-1 text-sm text-amber-700">Log in to your account to approve your proof or request changes.</p>
                <Link
                  href="/login"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-800 underline underline-offset-2"
                >
                  Log in to review proof <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-text">
                Total: R{result.total_amount.toFixed(2)}
              </p>
              <Link
                href="/contact"
                className="text-sm font-semibold text-brand-primary underline underline-offset-2"
              >
                Need help? Contact us
              </Link>
            </div>
          </div>
        )}

        {/* Help block */}
        <div className="mt-8 rounded-md border border-gray-100 bg-white p-6 text-center">
          <p className="text-sm text-brand-text-muted">
            Have an account?{' '}
            <Link href="/account/orders" className="font-semibold text-brand-primary underline underline-offset-2">
              View all your orders →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
