'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  Eye,
  FileImage,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import {
  ORDER_STATUS_LABELS,
  ORDER_ITEM_STATUS_LABELS,
} from '@/lib/utils/constants'
import type {
  Order,
  OrderItem,
  Profile,
  ProductionFile,
  UploadedFile,
  OrderStatus,
} from '@/types'

interface OrderDetail extends Omit<Order, 'profile'> {
  profile: Profile | null
  items: OrderItem[]
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [files, setFiles] = useState<{
    productionFiles: ProductionFile[]
    uploadedFiles: UploadedFile[]
  }>({ productionFiles: [], uploadedFiles: [] })
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)

  useEffect(() => {
    async function fetchOrder() {
      try {
        // Fetch order details via admin endpoint
        const res = await fetch(`/api/admin/orders?search=&page=1&limit=1`)
        // Actually we need a specific order endpoint. Let's use the admin client approach.
        // For now, fetch from the general orders API and find our order
        const orderRes = await fetch(`/api/admin/orders?page=1&limit=100`)
        if (!orderRes.ok) throw new Error('Failed to fetch order')

        // We need a dedicated order detail. Let's construct from what we have.
        // The better approach is to fetch directly.
        // Since we don't have a dedicated single-order admin endpoint,
        // we'll create the fetch inline.
        const detailRes = await fetch(`/api/admin/orders/${id}`)
        if (detailRes.ok) {
          const data = await detailRes.json()
          setOrder(data.order)
        } else {
          // Fallback: construct from list + additional data
          throw new Error('No detail endpoint')
        }
      } catch {
        // Fetch via the general approach with a client-side supabase call
        try {
          const res = await fetch(
            `/api/admin/orders?search=&page=1&limit=1000`
          )
          const data = await res.json()
          // This won't have full detail; mark as needing the detail API
          const found = data.orders?.find(
            (o: OrderDetail) => o.id === id
          )
          if (found) {
            setOrder(found)
          }
        } catch (err) {
          console.error('Order detail fetch error:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    async function fetchFiles() {
      try {
        const res = await fetch(`/api/admin/orders/${id}/files`)
        if (res.ok) {
          const data = await res.json()
          setFiles(data)
        }
      } catch (err) {
        console.error('Files fetch error:', err)
      }
    }

    fetchOrder()
    fetchFiles()
  }, [id])

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    setStatusUpdating(true)
    try {
      const res = await fetch('/api/admin/orders/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_ids: [order.id],
          status: newStatus,
        }),
      })
      if (res.ok) {
        setOrder((prev) =>
          prev ? { ...prev, status: newStatus as OrderStatus } : prev
        )
      }
    } catch (err) {
      console.error('Status update error:', err)
    } finally {
      setStatusUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700">Order not found</p>
        </div>
      </div>
    )
  }

  const statusInfo =
    ORDER_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS['draft']

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      {/* Order Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Order {order.order_number}
            </h1>
            <Badge
              variant="secondary"
              className={cn('text-sm', statusInfo.color)}
            >
              {statusInfo.label}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed on {formatDateTime(order.created_at)}
          </p>
        </div>

        {/* Status Update */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Update status:</span>
          <Select
            value={order.status}
            onValueChange={handleStatusChange}
            disabled={statusUpdating}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ORDER_STATUS_LABELS).map(
                ([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">
              {order.profile?.full_name ?? 'Unknown'}
            </p>
            {order.profile?.email && (
              <p className="text-muted-foreground">{order.profile.email}</p>
            )}
            {order.profile?.company_name && (
              <p className="text-muted-foreground">
                {order.profile.company_name}
              </p>
            )}
            {order.profile?.phone && (
              <p className="text-muted-foreground">{order.profile.phone}</p>
            )}
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {order.shipping_address ? (
              <>
                <p className="font-medium">
                  {order.shipping_address.full_name}
                </p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && (
                  <p>{order.shipping_address.address_line2}</p>
                )}
                <p>
                  {order.shipping_address.city},{' '}
                  {order.shipping_address.province}{' '}
                  {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country}</p>
              </>
            ) : (
              <p className="text-muted-foreground">No shipping address</p>
            )}
          </CardContent>
        </Card>

        {/* Order Totals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (VAT)</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatCurrency(order.shipping_cost)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            {order.payment_method && (
              <>
                <Separator />
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Payment</span>
                  <span>{order.payment_method}</span>
                </div>
              </>
            )}
            {order.payment_reference && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono">{order.payment_reference}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Notes */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {order.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Template</th>
                  <th className="px-4 py-3 text-center font-medium">Qty</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Parameters
                  </th>
                  <th className="px-4 py-3 text-center font-medium">Design</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => {
                    const itemStatus =
                      ORDER_ITEM_STATUS_LABELS[item.status] ??
                      ORDER_ITEM_STATUS_LABELS['pending_design']

                    return (
                      <tr key={item.id} className="border-b">
                        <td className="px-4 py-3 font-medium">
                          {item.product_group?.name ?? 'Custom Product'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.product_template?.name ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3">
                          {item.selected_params &&
                          Object.keys(item.selected_params).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(item.selected_params).map(
                                ([key, val]) => (
                                  <span
                                    key={key}
                                    className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs"
                                  >
                                    {key}: {String(val)}
                                  </span>
                                )
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.design ? (
                            <div className="mx-auto h-10 w-10 overflow-hidden rounded border bg-gray-50">
                              {item.design.thumbnail_url ? (
                                <img
                                  src={item.design.thumbnail_url}
                                  alt="Design preview"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                  <FileImage className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No design
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', itemStatus.color)}
                          >
                            {itemStatus.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(item.line_total)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.design && (
                              <Button size="sm" variant="ghost" title="View Design">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {item.proofs && item.proofs.length > 0 && (
                              <Button size="sm" variant="ghost" title="View Proofs">
                                <FileText className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Download Production Files"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No items in this order
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Production Files */}
      {(files.productionFiles.length > 0 ||
        files.uploadedFiles.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.productionFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.file_type.toUpperCase()} - {file.resolution_dpi}
                        dpi
                        {file.has_bleed ? ' - With bleed' : ''}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Download
                    </a>
                  </Button>
                </div>
              ))}
              {files.uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileImage className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {file.original_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file.purpose} -{' '}
                        {file.file_size_bytes
                          ? `${(file.file_size_bytes / 1024).toFixed(1)} KB`
                          : 'Unknown size'}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
