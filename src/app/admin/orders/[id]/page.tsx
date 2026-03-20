'use client'

import { useEffect, useState, use, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Eye,
  FileImage,
  FileText,
  Mail,
  Package,
  Truck,
  CheckCircle,
  Clock,
  CreditCard,
  Save,
  AlertCircle,
  Archive,
  Table,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
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
  OrderStatusHistory,
} from '@/types'
import { AdminProofPanel } from '@/components/admin/ProofPanel'

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
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [history, setHistory] = useState<OrderStatusHistory[]>([])
  const [files, setFiles] = useState<{
    productionFiles: ProductionFile[]
    uploadedFiles: UploadedFile[]
  }>({ productionFiles: [], uploadedFiles: [] })
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)

  // Editable fields
  const [adminNotes, setAdminNotes] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [savingTracking, setSavingTracking] = useState(false)

  // Email states
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)

  // Ship dialog
  const [shipDialogOpen, setShipDialogOpen] = useState(false)
  const [shipTracking, setShipTracking] = useState('')
  const [shipSendEmail, setShipSendEmail] = useState(true)
  const [shipping, setShipping] = useState(false)

  // ZIP download
  const [downloadingZip, setDownloadingZip] = useState(false)

  // Production file generation
  const [generatingProduction, setGeneratingProduction] = useState(false)
  const [productionResult, setProductionResult] = useState<{
    files_generated: number
    errors: string[]
  } | null>(null)

  // CSV viewer
  const [csvJobData, setCsvJobData] = useState<{ headers: string[]; rows: string[][]; filename?: string; totalRows?: number } | null>(null)
  const [csvViewerOpen, setCsvViewerOpen] = useState(false)

  const handleGenerateProduction = async () => {
    setGeneratingProduction(true)
    setProductionResult(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}/production`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formats: ['pdf'] }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Generation failed: ${data.error || 'Unknown error'}`)
        return
      }
      setProductionResult({ files_generated: data.files_generated, errors: data.errors ?? [] })

      // Refresh files list
      const filesRes = await fetch(`/api/admin/orders/${id}/files`)
      if (filesRes.ok) setFiles(await filesRes.json())
    } catch (err) {
      console.error('Production generation error:', err)
      alert('Failed to generate production files')
    } finally {
      setGeneratingProduction(false)
    }
  }

  const handleDownloadZip = async () => {
    setDownloadingZip(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}/files`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        alert(`Failed to generate ZIP: ${data.error || 'Unknown error'}`)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${order?.order_number || id}_production_files.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('ZIP download error:', err)
      alert('Failed to download ZIP')
    } finally {
      setDownloadingZip(false)
    }
  }

  const handleViewCsvData = async (csvJobId: string) => {
    try {
      const res = await fetch(`/api/admin/csv/${csvJobId}`)
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Failed to load CSV data')
        return
      }
      const data = await res.json()
      if (data.headers?.length > 0) {
        setCsvJobData({ headers: data.headers, rows: data.rows, filename: data.filename, totalRows: data.pagination.total })
        setCsvViewerOpen(true)
      }
    } catch (err) {
      console.error('CSV load error:', err)
      alert('Failed to load CSV data')
    }
  }

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setOrder(data.order)
      setHistory(data.history ?? [])
      setAdminNotes(data.order?.admin_notes ?? '')
      setTrackingNumber(data.order?.tracking_number ?? '')
    } catch (err) {
      console.error('Order detail fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchOrder()

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
    fetchFiles()
  }, [id, fetchOrder])

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    setStatusUpdating(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        await fetchOrder()
      }
    } catch (err) {
      console.error('Status update error:', err)
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes }),
      })
      if (res.ok) {
        setOrder((prev) => (prev ? { ...prev, admin_notes: adminNotes } : prev))
      }
    } catch (err) {
      console.error('Save notes error:', err)
    } finally {
      setSavingNotes(false)
    }
  }

  const handleSaveTracking = async () => {
    setSavingTracking(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_number: trackingNumber }),
      })
      if (res.ok) {
        setOrder((prev) =>
          prev ? { ...prev, tracking_number: trackingNumber } : prev
        )
      }
    } catch (err) {
      console.error('Save tracking error:', err)
    } finally {
      setSavingTracking(false)
    }
  }

  const handleMarkShipped = async () => {
    if (!order) return
    setShipping(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          tracking_number: shipTracking || trackingNumber,
        }),
      })
      if (!res.ok) throw new Error('Failed to update')

      if (shipSendEmail) {
        await fetch(`/api/admin/orders/${id}/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'shipped',
            trackingNumber: shipTracking || trackingNumber || 'N/A',
          }),
        })
      }

      setShipDialogOpen(false)
      await fetchOrder()
    } catch (err) {
      console.error('Ship error:', err)
    } finally {
      setShipping(false)
    }
  }

  const handleSendEmail = async (
    type: 'confirmation' | 'payment' | 'proof' | 'shipped'
  ) => {
    setSendingEmail(type)
    setEmailSuccess(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          trackingNumber: trackingNumber || order?.tracking_number || 'N/A',
        }),
      })
      if (res.ok) {
        setEmailSuccess(type)
        setTimeout(() => setEmailSuccess(null), 3000)
      } else {
        const data = await res.json()
        alert(`Failed to send email: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Email send error:', err)
      alert('Failed to send email')
    } finally {
      setSendingEmail(null)
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Generate production files */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleGenerateProduction}
            disabled={generatingProduction}
            title="Generate print-ready PDFs with bleed"
          >
            {generatingProduction ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Generate Production Files
          </Button>

          {/* Download all files as ZIP */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDownloadZip}
            disabled={downloadingZip}
          >
            {downloadingZip ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            Download ZIP
          </Button>

          {/* Mark as Shipped */}
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Truck className="h-4 w-4" />
                  Mark as Shipped
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark Order as Shipped</DialogTitle>
                  <DialogDescription>
                    Update the order status and optionally notify the customer.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tracking Number</Label>
                    <Input
                      placeholder="Enter tracking number..."
                      value={shipTracking}
                      onChange={(e) => setShipTracking(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ship-send-email"
                      checked={shipSendEmail}
                      onChange={(e) => setShipSendEmail(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="ship-send-email" className="text-sm">
                      Send shipping notification email to customer
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShipDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleMarkShipped}
                    disabled={shipping}
                    className="gap-2"
                  >
                    {shipping ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Shipping...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4" />
                        Mark as Shipped
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Status Update */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
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
      </div>

      {/* Production result banner */}
      {productionResult && (
        <div
          className={cn(
            'rounded-lg border p-4 text-sm',
            productionResult.errors.length > 0
              ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
              : 'border-green-200 bg-green-50 text-green-800'
          )}
        >
          <div className="flex items-start gap-3">
            {productionResult.errors.length > 0 ? (
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            ) : (
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            )}
            <div>
              <p className="font-medium">
                {productionResult.files_generated} production file(s) generated
                {productionResult.errors.length > 0 && ` · ${productionResult.errors.length} error(s)`}
              </p>
              {productionResult.errors.length > 0 && (
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
                  {productionResult.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

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
            {order.profile && (
              <Link
                href={`/admin/users/${order.user_id}`}
                className="mt-2 inline-block text-xs text-brand-primary hover:underline"
              >
                View customer profile &rarr;
              </Link>
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Admin Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Admin Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Add internal notes about this order..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="gap-2"
            >
              {savingNotes ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Notes
            </Button>
          </CardContent>
        </Card>

        {/* Tracking Number */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Tracking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Tracking Number</Label>
              <Input
                placeholder="Enter tracking number..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSaveTracking}
                disabled={savingTracking}
                className="gap-2"
              >
                {savingTracking ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save Tracking
              </Button>
            </div>
            {order.shipped_at && (
              <p className="text-xs text-muted-foreground">
                Shipped on {formatDateTime(order.shipped_at)}
              </p>
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

      {/* Email Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Send automated emails to the customer ({order.profile?.email ?? 'no email'})
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              disabled={sendingEmail !== null}
              onClick={() => handleSendEmail('confirmation')}
            >
              {sendingEmail === 'confirmation' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
              ) : emailSuccess === 'confirmation' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Package className="h-5 w-5 text-blue-500" />
              )}
              <span className="text-xs font-medium">Order Confirmation</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              disabled={sendingEmail !== null}
              onClick={() => handleSendEmail('payment')}
            >
              {sendingEmail === 'payment' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
              ) : emailSuccess === 'payment' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <CreditCard className="h-5 w-5 text-green-500" />
              )}
              <span className="text-xs font-medium">Payment Received</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              disabled={sendingEmail !== null}
              onClick={() => handleSendEmail('proof')}
            >
              {sendingEmail === 'proof' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
              ) : emailSuccess === 'proof' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Eye className="h-5 w-5 text-purple-500" />
              )}
              <span className="text-xs font-medium">Proof Ready</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              disabled={sendingEmail !== null}
              onClick={() => handleSendEmail('shipped')}
            >
              {sendingEmail === 'shipped' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
              ) : emailSuccess === 'shipped' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Truck className="h-5 w-5 text-orange-500" />
              )}
              <span className="text-xs font-medium">Order Shipped</span>
            </Button>
          </div>
        </CardContent>
      </Card>

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
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Preview Design"
                                asChild
                              >
                                <a
                                  href={`/designer/${item.product_template_id}?designId=${item.design_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            )}
                            {item.csv_job_id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="View CSV Data"
                                onClick={() => handleViewCsvData(item.csv_job_id!)}
                              >
                                <Table className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {item.proofs && item.proofs.length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="View Proofs"
                                asChild
                              >
                                <a href="#proof-management">
                                  <FileText className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            )}
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

      {/* Proof Management */}
      {order.items && order.items.length > 0 && (
        <div id="proof-management">
          <AdminProofPanel
            orderId={id}
            orderItems={order.items}
            onRefresh={fetchOrder}
          />
        </div>
      )}

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

      {/* CSV Data Viewer Modal */}
      {csvViewerOpen && csvJobData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <Table className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">CSV Variable Data</h3>
                {csvJobData.filename && (
                  <span className="text-xs text-muted-foreground font-mono">{csvJobData.filename}</span>
                )}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-muted-foreground">
                  {csvJobData.totalRows ?? csvJobData.rows.length} rows
                </span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setCsvViewerOpen(false)}>
                ✕
              </Button>
            </div>
            <div className="overflow-auto p-4" style={{ maxHeight: 'calc(80vh - 64px)' }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                    {csvJobData.headers.filter((h) => !h.startsWith('_')).map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {csvJobData.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                      {row.filter((_, j) => !csvJobData.headers[j]?.startsWith('_')).map((cell, j) => (
                        <td key={j} className="px-3 py-2 whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Order Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-0">
            {/* Created event */}
            <TimelineEvent
              icon={<Package className="h-3.5 w-3.5" />}
              title="Order Created"
              subtitle={order.order_number}
              timestamp={order.created_at}
              isLast={history.length === 0}
              color="bg-gray-500"
            />

            {/* Status history from DB */}
            {history.map((entry, i) => {
              const statusLabel =
                ORDER_STATUS_LABELS[entry.status]?.label ?? entry.status
              const iconMap: Record<string, React.ReactNode> = {
                paid: <CreditCard className="h-3.5 w-3.5" />,
                in_production: <AlertCircle className="h-3.5 w-3.5" />,
                completed: <CheckCircle className="h-3.5 w-3.5" />,
                cancelled: <AlertCircle className="h-3.5 w-3.5" />,
              }
              const colorMap: Record<string, string> = {
                paid: 'bg-blue-500',
                in_production: 'bg-purple-500',
                completed: 'bg-green-500',
                cancelled: 'bg-red-500',
              }
              return (
                <TimelineEvent
                  key={entry.id}
                  icon={
                    iconMap[entry.status] ?? (
                      <Clock className="h-3.5 w-3.5" />
                    )
                  }
                  title={`Status changed to ${statusLabel}`}
                  subtitle={entry.notes || undefined}
                  timestamp={entry.created_at}
                  isLast={i === history.length - 1}
                  color={colorMap[entry.status] ?? 'bg-gray-500'}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TimelineEvent({
  icon,
  title,
  subtitle,
  timestamp,
  isLast,
  color = 'bg-gray-500',
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  timestamp: string
  isFirst?: boolean
  isLast?: boolean
  color?: string
}) {
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />
      )}
      {/* Dot / icon */}
      <div
        className={cn(
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white',
          color
        )}
      >
        {icon}
      </div>
      {/* Content */}
      <div className="pt-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDateTime(timestamp)}
        </p>
      </div>
    </div>
  )
}
