'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS, ORDER_ITEM_STATUS_LABELS } from '@/lib/utils/constants'
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

      // Fetch production files if order exists
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
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <p className="text-lg text-brand-gray-medium">Order not found.</p>
        <Link href="/account/orders" className="mt-4 inline-block text-brand-red hover:underline">
          Back to Orders
        </Link>
      </div>
    )
  }

  const status = ORDER_STATUS_LABELS[order.status] || {
    label: order.status,
    color: 'bg-gray-100 text-gray-700',
  }
  const canReorder = order.status === 'completed' || order.status === 'cancelled'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/account/orders"
        className="mb-4 inline-block text-sm text-brand-gray-medium hover:text-brand-red"
      >
        &larr; Back to Orders
      </Link>

      {/* Order Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-black">{order.order_number}</h1>
          <p className="text-brand-gray-medium">
            Placed {formatDateTime(order.created_at)}
          </p>
          {order.tracking_number && (
            <p className="mt-1 text-sm text-brand-gray-medium">
              Tracking: <span className="font-mono font-medium">{order.tracking_number}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
          {productionFiles.length > 0 && (
            <button
              onClick={handleDownloadFiles}
              disabled={downloading}
              className="flex items-center gap-2 rounded-lg border border-brand-red px-4 py-2 text-sm font-semibold text-brand-red transition hover:bg-brand-red hover:text-white disabled:opacity-60"
            >
              {downloading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
                  Preparing…
                </>
              ) : (
                `Download Files (${productionFiles.length})`
              )}
            </button>
          )}
          {canReorder && (
            <button
              onClick={handleReorder}
              disabled={reordering}
              className="flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-red-light disabled:opacity-60"
            >
              {reordering ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating order…
                </>
              ) : (
                'Reorder'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-8 rounded-lg border border-brand-gray-light bg-white">
        <div className="border-b border-brand-gray-light p-4">
          <h2 className="text-lg font-semibold text-brand-black">Order Items</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const itemStatus = ORDER_ITEM_STATUS_LABELS[item.status] || {
              label: item.status,
              color: 'bg-gray-100 text-gray-700',
            }
            return (
              <div key={item.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-xs text-brand-gray-medium">
                    Preview
                  </div>
                  <div>
                    <p className="font-medium text-brand-black">
                      {(item.product_group as any)?.name || 'Product'}
                    </p>
                    <p className="text-sm text-brand-gray-medium">
                      {(item.product_template as any)?.name || 'Template'} &middot; Qty:{' '}
                      {item.quantity}
                    </p>
                    {item.selected_params && Object.keys(item.selected_params).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(item.selected_params).map(([k, v]) => (
                          <span
                            key={k}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-brand-gray-medium"
                          >
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-medium">{formatCurrency(item.line_total)}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${itemStatus.color}`}>
                    {itemStatus.label}
                  </span>
                  {item.status === 'proof_sent' && (
                    <Link
                      href={`/account/orders/${order.id}/proof/${item.id}`}
                      className="rounded bg-brand-red px-3 py-1 text-xs text-white hover:bg-brand-red-light"
                    >
                      Review Proof
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Shipping address (if available) */}
      {order.shipping_address && Object.keys(order.shipping_address).length > 0 && (
        <div className="mb-8 rounded-lg border border-brand-gray-light bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-brand-black">Shipping Address</h2>
          <div className="text-sm text-brand-gray-medium">
            {order.shipping_address.full_name && (
              <p className="font-medium text-brand-black">{order.shipping_address.full_name}</p>
            )}
            {order.shipping_address.address_line1 && <p>{order.shipping_address.address_line1}</p>}
            {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
            {(order.shipping_address.city || order.shipping_address.province) && (
              <p>
                {[order.shipping_address.city, order.shipping_address.province, order.shipping_address.postal_code]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="rounded-lg border border-brand-gray-light bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-brand-black">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-brand-gray-medium">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-gray-medium">VAT (15%)</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-gray-medium">Shipping</span>
            <span>{formatCurrency(order.shipping_cost)}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
          {order.payment_reference && (
            <div className="flex justify-between border-t pt-2 text-xs text-brand-gray-medium">
              <span>Payment Reference</span>
              <span className="font-mono">{order.payment_reference}</span>
            </div>
          )}
        </div>

        {/* Reorder button at bottom too */}
        {canReorder && (
          <button
            onClick={handleReorder}
            disabled={reordering}
            className="mt-6 w-full rounded-lg bg-brand-red py-3 text-base font-semibold text-white transition hover:bg-brand-red-light disabled:opacity-60"
          >
            {reordering ? 'Creating reorder…' : 'Reorder This'}
          </button>
        )}
      </div>
    </div>
  )
}
