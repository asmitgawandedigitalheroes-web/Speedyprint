'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import {
  ArrowLeft,
  Download,
  RotateCcw,
  Package,
  MapPin,
  ShieldCheck,
  CreditCard,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Order, OrderItem } from '@/types'

/* ─── Brand-safe status helpers ─── */
const ORDER_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  draft:           { label: 'Draft',           bg: 'rgba(224,224,224,0.9)', text: '#555' },
  pending_payment: { label: 'Pending Payment', bg: 'rgba(255,193,7,0.18)',  text: '#7a5c00' },
  paid:            { label: 'Paid',            bg: 'rgba(34,197,94,0.12)',  text: '#15803d' },
  in_production:   { label: 'In Production',   bg: 'rgba(227,6,19,0.12)',   text: '#c00510' },
  completed:       { label: 'Completed',       bg: 'rgba(30,41,59,0.18)',   text: '#1E293B' },
  cancelled:       { label: 'Cancelled',       bg: 'rgba(227,6,19,0.08)',   text: '#E30613' },
}

const ITEM_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  pending_design: { label: 'Pending Design', bg: 'rgba(224,224,224,0.9)', text: '#555' },
  pending_proof:  { label: 'Pending Proof',  bg: 'rgba(30,41,59,0.10)',   text: '#1E293B' },
  proof_sent:     { label: 'Proof Ready',    bg: 'rgba(255,193,7,0.18)',  text: '#7a5c00' },
  approved:       { label: 'Approved',       bg: 'rgba(30,41,59,0.15)',   text: '#1E293B' },
  in_production:  { label: 'In Production',  bg: 'rgba(227,6,19,0.12)',   text: '#c00510' },
  completed:      { label: 'Completed',      bg: 'rgba(30,41,59,0.18)',   text: '#1E293B' },
}

function Badge({ status, map }: { status: string; map: Record<string, { label: string; bg: string; text: string }> }) {
  const s = map[status] ?? { label: status, bg: '#E0E0E0', text: '#333' }
  return (
    <span
      className="inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[#E7E5E4] bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#E7E5E4] px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F6F7]">
          <Icon className="h-4 w-4 text-brand-text-muted" />
        </div>
        <h2 className="font-heading text-sm font-semibold text-brand-text">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function OrderDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const { user }  = useAuth()
  const router    = useRouter()
  const [order,            setOrder]            = useState<Order | null>(null)
  const [items,            setItems]            = useState<OrderItem[]>([])
  const [loading,          setLoading]          = useState(true)
  const [reordering,       setReordering]       = useState(false)
  const [productionFiles,  setProductionFiles]  = useState<any[]>([])
  const [downloading,      setDownloading]      = useState(false)
  const [payingOrderId,    setPayingOrderId]    = useState<string | null>(null)

  useEffect(() => {
    if (!user || !id) return
    const supabase = createClient()

    async function fetchOrder() {
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).eq('user_id', user!.id).single(),
        supabase
          .from('order_items')
          .select('*, product_group:product_groups(name), product_template:product_templates(name)')
          .eq('order_id', id),
      ])
      setOrder(orderRes.data as Order | null)
      setItems((itemsRes.data as OrderItem[]) || [])
      setLoading(false)

      if (orderRes.data) {
        try {
          const filesRes = await fetch(`/api/orders/${id}/files`)
          if (filesRes.ok) {
            const { files } = await filesRes.json()
            setProductionFiles(files ?? [])
          }
        } catch { /* Non-fatal */ }
      }
    }

    fetchOrder()
  }, [user, id])

  const handleDownloadFiles = async () => {
    if (!order) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/files`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error || 'Download failed')
        return
      }
      const blob = await res.blob()
      if (blob.size === 0) {
        alert('The download file appears to be empty. Please try again.')
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${order.order_number}_production.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch {
      alert('Failed to download files. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleCompletePayment = async () => {
    if (!order) return
    setPayingOrderId(order.id)
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (err: any) {
      console.error('Payment Error:', err)
      toast.error(err.message || 'Payment failed. Please try again.')
    } finally {
      setPayingOrderId(null)
    }
  }

  const handleReorder = async () => {
    if (!order) return
    setReordering(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/reorder`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); alert(`Failed: ${d.error || 'Unknown error'}`); return }
      const { order: newOrder } = await res.json()
      router.push(`/checkout?order_id=${newOrder.id}`)
    } catch { alert('Failed to reorder. Please try again.') }
    finally { setReordering(false) }
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 h-5 w-32 animate-pulse rounded bg-white" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      </div>
    )
  }

  /* ── Not found ── */
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-brand-text-muted">Order not found.</p>
        <Link href="/account/orders" className="mt-4 text-sm font-medium text-brand-primary hover:underline">
          ← Back to orders
        </Link>
      </div>
    )
  }

  const canReorder = order.status === 'completed' || order.status === 'cancelled'

  return (
    <div className="p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="mb-6">
        <Link
          href="/account/orders"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand-text-muted transition hover:text-brand-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">Order</p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-brand-text">{order.order_number}</h1>
            <p className="mt-1 text-sm text-brand-text-muted">Placed {formatDateTime(order.created_at)}</p>
            {order.tracking_number && (
              <p className="mt-1 text-xs text-brand-text-muted">
                Tracking:{' '}
                <span className="font-mono font-semibold text-brand-text">{order.tracking_number}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge status={order.status} map={ORDER_BADGE} />

            {order.status === 'pending_payment' && (
              <button
                onClick={handleCompletePayment}
                disabled={!!payingOrderId}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
              >
                {payingOrderId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {payingOrderId ? 'Redirecting…' : 'Complete Payment'}
              </button>
            )}

            {(order.status === 'completed' || order.status === 'in_production' || productionFiles.length > 0) && (
              <button
                onClick={handleDownloadFiles}
                disabled={downloading || productionFiles.length === 0}
                title={productionFiles.length === 0 ? 'Production files are not ready yet' : `Download ${productionFiles.length} file(s)`}
                className="inline-flex items-center gap-2 rounded-lg border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white disabled:opacity-60"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloading ? 'Preparing…' : productionFiles.length > 0 ? `Download Files (${productionFiles.length})` : 'Files Not Ready'}
              </button>
            )}

            {canReorder && (
              <button
                onClick={handleReorder}
                disabled={reordering}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
              >
                {reordering ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {reordering ? 'Creating…' : 'Reorder'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">

        {/* ── Order items ── */}
        <SectionCard icon={Package} title="Order Items">
          <div className="divide-y divide-[#F0F0F0]">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-4">
                  {/* Thumbnail / placeholder */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-[#E7E5E4] bg-[#F5F6F7] text-[10px] text-brand-text-muted">
                    Preview
                  </div>

                  <div>
                    <p className="font-semibold text-brand-text">
                      {(item.product_group as any)?.name || 'Product'}
                    </p>
                    <p className="mt-0.5 text-sm text-brand-text-muted">
                      {(item.product_template as any)?.name || 'Template'} &middot; Qty: {item.quantity}
                    </p>

                    {item.selected_params && Object.keys(item.selected_params).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(item.selected_params).map(([k, v]) => (
                          <span
                            key={k}
                            className="rounded bg-[#F5F6F7] px-1.5 py-0.5 text-[11px] text-brand-text-muted"
                          >
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="font-semibold text-brand-text">{formatCurrency(item.line_total)}</p>
                  <Badge status={item.status} map={ITEM_BADGE} />
                  {item.status === 'proof_sent' && (
                    <Link
                      href={`/account/orders/${order.id}/proof/${item.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-primary-dark"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Review Proof
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2">

          {/* ── Shipping address ── */}
          {order.shipping_address && Object.keys(order.shipping_address).length > 0 && (
            <SectionCard icon={MapPin} title="Shipping Address">
              <div className="text-sm leading-relaxed text-brand-text-muted">
                {order.shipping_address.full_name && (
                  <p className="font-semibold text-brand-text">{order.shipping_address.full_name}</p>
                )}
                {order.shipping_address.address_line1 && <p>{order.shipping_address.address_line1}</p>}
                {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                {(order.shipping_address.city || order.shipping_address.province) && (
                  <p>
                    {[
                      order.shipping_address.city,
                      order.shipping_address.province,
                      order.shipping_address.postal_code,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            </SectionCard>
          )}

          {/* ── Order summary ── */}
          <SectionCard icon={CreditCard} title="Order Summary">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Subtotal</span>
                <span className="text-brand-text">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-muted">GST (18%)</span>
                <span className="text-brand-text">{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-text-muted">Shipping</span>
                <span className="text-brand-text">{formatCurrency(order.shipping_cost)}</span>
              </div>
            </div>

            <div className="my-4 h-px bg-[#E7E5E4]" />

            <div className="flex items-center justify-between">
              <span className="font-semibold text-brand-text">Total</span>
              <span className="font-heading text-xl font-bold text-brand-primary">
                {formatCurrency(order.total)}
              </span>
            </div>

            {order.payment_reference && (
              <p className="mt-3 text-xs text-brand-text-muted">
                Payment ref:{' '}
                <span className="font-mono font-semibold text-brand-text">{order.payment_reference}</span>
              </p>
            )}

            {order.status === 'pending_payment' && (
              <button
                onClick={handleCompletePayment}
                disabled={!!payingOrderId}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
              >
                {payingOrderId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {payingOrderId ? 'Redirecting…' : 'Complete Payment'}
              </button>
            )}

            {canReorder && (
              <button
                onClick={handleReorder}
                disabled={reordering}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
              >
                {reordering ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {reordering ? 'Creating reorder…' : 'Reorder This'}
              </button>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
