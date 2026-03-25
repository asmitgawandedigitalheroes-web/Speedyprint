'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS, ORDER_ITEM_STATUS_LABELS } from '@/lib/utils/constants'
import { ArrowLeft, Download, RotateCcw, Loader2 } from 'lucide-react'
import type { Order, OrderItem } from '@/types'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reordering, setReordering] = useState(false)
  const [productionFiles, setProductionFiles] = useState<any[]>([])
  const [downloading, setDownloading] = useState(false)

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
        } catch {
          // Non-fatal
        }
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
        const data = await res.json()
        alert(data.error || 'Download failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${order.order_number}_production.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download files. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleReorder = async () => {
    if (!order) return
    setReordering(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/reorder`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        alert(`Failed to reorder: ${data.error || 'Unknown error'}`)
        return
      }
      const { order: newOrder } = await res.json()
      router.push(`/checkout?order_id=${newOrder.id}`)
    } catch (err) {
      console.error('Reorder error:', err)
      alert('Failed to reorder. Please try again.')
    } finally {
      setReordering(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-brand-bg min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-6 w-48 animate-pulse rounded-md bg-white mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-md bg-white border border-gray-100" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="bg-brand-bg min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 text-center">
          <p className="text-brand-text-muted">Order not found.</p>
          <Link href="/account/orders" className="mt-4 inline-block text-sm font-medium text-brand-primary hover:underline">
            Back to orders
          </Link>
        </div>
      </div>
    )
  }

  const status = ORDER_STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' }
  const canReorder = order.status === 'completed' || order.status === 'cancelled'

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/account/orders"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand-text-muted hover:text-brand-primary transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
          </Link>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="h-1 w-8 bg-brand-primary mb-3" />
              <h1 className="font-heading text-2xl font-bold text-brand-text">{order.order_number}</h1>
              <p className="mt-1 text-sm text-brand-text-muted">Placed {formatDateTime(order.created_at)}</p>
              {order.tracking_number && (
                <p className="mt-1 text-xs text-brand-text-muted">
                  Tracking: <span className="font-mono font-medium text-brand-text">{order.tracking_number}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-sm px-2.5 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
              {productionFiles.length > 0 && (
                <button
                  onClick={handleDownloadFiles}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 rounded-md border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white disabled:opacity-60"
                >
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {downloading ? 'Preparing…' : `Download (${productionFiles.length})`}
                </button>
              )}
              {canReorder && (
                <button
                  onClick={handleReorder}
                  disabled={reordering}
                  className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
                >
                  {reordering ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  {reordering ? 'Creating…' : 'Reorder'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-4">
        {/* Order Items */}
        <div className="rounded-md border border-gray-100 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-heading text-base font-semibold text-brand-text">Order items</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map((item) => {
              const itemStatus = ORDER_ITEM_STATUS_LABELS[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-700' }
              return (
                <div key={item.id} className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-md border border-gray-100 bg-brand-bg text-xs text-brand-text-muted">
                      Preview
                    </div>
                    <div>
                      <p className="font-semibold text-brand-text">{(item.product_group as any)?.name || 'Product'}</p>
                      <p className="text-sm text-brand-text-muted">
                        {(item.product_template as any)?.name || 'Template'} · Qty: {item.quantity}
                      </p>
                      {item.selected_params && Object.keys(item.selected_params).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(item.selected_params).map(([k, v]) => (
                            <span key={k} className="rounded-sm bg-brand-bg px-1.5 py-0.5 text-xs text-brand-text-muted">
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-semibold text-brand-text">{formatCurrency(item.line_total)}</p>
                    <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${itemStatus.color}`}>{itemStatus.label}</span>
                    {item.status === 'proof_sent' && (
                      <Link
                        href={`/account/orders/${order.id}/proof/${item.id}`}
                        className="rounded-md bg-brand-primary px-3 py-1 text-xs font-semibold text-white hover:bg-brand-primary-dark transition"
                      >
                        Review proof
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Shipping Address */}
        {order.shipping_address && Object.keys(order.shipping_address).length > 0 && (
          <div className="rounded-md border border-gray-100 bg-white p-6">
            <h2 className="font-heading text-base font-semibold text-brand-text mb-3">Shipping address</h2>
            <div className="text-sm text-brand-text-muted leading-relaxed">
              {order.shipping_address.full_name && (
                <p className="font-medium text-brand-text">{order.shipping_address.full_name}</p>
              )}
              {order.shipping_address.address_line1 && <p>{order.shipping_address.address_line1}</p>}
              {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
              {(order.shipping_address.city || order.shipping_address.province) && (
                <p>{[order.shipping_address.city, order.shipping_address.province, order.shipping_address.postal_code].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="rounded-md border border-gray-100 bg-white p-6">
          <h2 className="font-heading text-base font-semibold text-brand-text mb-4">Order summary</h2>
          <div className="h-px bg-gray-100 mb-4" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-text-muted">Subtotal</span>
              <span className="text-brand-text">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-muted">VAT (15%)</span>
              <span className="text-brand-text">{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-muted">Shipping</span>
              <span className="text-brand-text">{formatCurrency(order.shipping_cost)}</span>
            </div>
          </div>
          <div className="my-4 h-px bg-gray-100" />
          <div className="flex justify-between">
            <span className="font-semibold text-brand-text">Total</span>
            <span className="font-heading text-xl font-bold text-brand-primary">{formatCurrency(order.total)}</span>
          </div>
          {order.payment_reference && (
            <p className="mt-3 text-xs text-brand-text-muted">
              Payment ref: <span className="font-mono text-brand-text">{order.payment_reference}</span>
            </p>
          )}
          {canReorder && (
            <button
              onClick={handleReorder}
              disabled={reordering}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
            >
              {reordering ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {reordering ? 'Creating reorder…' : 'Reorder this'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
