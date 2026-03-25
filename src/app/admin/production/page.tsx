'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Download,
  FileText,
  Package,
  RefreshCw,
  Archive,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  Printer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { toast } from 'sonner'

interface ProductionOrder {
  id: string
  order_number: string
  status: string
  created_at: string
  total: number
  customer: { name: string | null; email: string | null }
  item_count: number
  ready_item_count: number
  production_file_count: number
  has_production_files: boolean
  latest_generated_at: string | null
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-blue-100 text-blue-700',
  in_production: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterProduct, setFilterProduct] = useState('')

  // Per-order generate + download state
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Batch download state
  const [batchDownloading, setBatchDownloading] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (filterStatus) params.set('status', filterStatus)
      if (filterDateFrom) params.set('dateFrom', filterDateFrom)
      if (filterDateTo) params.set('dateTo', filterDateTo)

      const res = await fetch(`/api/admin/production?${params}`)
      if (!res.ok) throw new Error('Failed to fetch production orders')
      const data = await res.json()
      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } catch (err) {
      toast.error('Failed to load production orders')
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus, filterDateFrom, filterDateTo])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // ── Per-order: generate production files ────────────────────────────────────
  const handleGenerate = async (orderId: string, orderNum: string) => {
    setGeneratingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/production`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formats: ['pdf'] }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(`Generation failed: ${data.error || 'Unknown error'}`)
        return
      }
      if (data.errors?.length > 0) {
        toast.warning(`${data.files_generated} file(s) generated with ${data.errors.length} error(s)`)
      } else {
        toast.success(`${data.files_generated} production file(s) generated for ${orderNum}`)
      }
      await fetchOrders()
    } catch {
      toast.error('Failed to generate production files')
    } finally {
      setGeneratingId(null)
    }
  }

  // ── Per-order: download ZIP ─────────────────────────────────────────────────
  const handleDownload = async (orderId: string, orderNum: string) => {
    setDownloadingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/files`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to download ZIP')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${orderNum}_production.zip`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${orderNum}_production.zip`)
    } catch {
      toast.error('Failed to download ZIP')
    } finally {
      setDownloadingId(null)
    }
  }

  // ── Batch download ──────────────────────────────────────────────────────────
  const handleBatchDownload = async () => {
    setBatchDownloading(true)
    try {
      const res = await fetch('/api/admin/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: filterStatus || undefined,
          dateFrom: filterDateFrom || undefined,
          dateTo: filterDateTo || undefined,
          product_type: filterProduct || undefined,
          limit: 50,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Batch download failed')
        return
      }

      const orderCount = res.headers.get('X-Order-Count') ?? '?'
      const fileCount = res.headers.get('X-File-Count') ?? '?'
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const fileNameMatch = disposition.match(/filename="([^"]+)"/)
      const fileName = fileNameMatch?.[1] ?? 'batch_production.zip'

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${orderCount} orders, ${fileCount} files`)
    } catch {
      toast.error('Batch download failed')
    } finally {
      setBatchDownloading(false)
    }
  }

  const readyCount = orders.filter((o) => o.has_production_files).length
  const pendingCount = orders.filter((o) => !o.has_production_files).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Production</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and download print-ready files for production
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={handleBatchDownload}
          disabled={batchDownloading}
        >
          {batchDownloading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
          Batch Download ZIP
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Orders', value: total, icon: Package, color: 'text-blue-600' },
          { label: 'Files Ready', value: readyCount, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Awaiting Files', value: pendingCount, icon: Clock, color: 'text-orange-600' },
          {
            label: 'Total Files',
            value: orders.reduce((s, o) => s + o.production_file_count, 0),
            icon: FileText,
            color: 'text-purple-600',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Icon className={cn('h-5 w-5', color)} />
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={filterStatus || '_all'}
                onValueChange={(v) => {
                  setFilterStatus(v === '_all' ? '' : v)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="in_production">In Production</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">From Date</Label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To Date</Label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Product Type</Label>
              <Input
                placeholder="e.g. Race Bib"
                value={filterProduct}
                onChange={(e) => { setFilterProduct(e.target.value); setPage(1) }}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={fetchOrders} className="gap-2">
              <Filter className="h-3.5 w-3.5" />
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFilterStatus('')
                setFilterDateFrom('')
                setFilterDateTo('')
                setFilterProduct('')
                setPage(1)
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Printer className="h-4 w-4" />
              Production Orders
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {total}
              </span>
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={fetchOrders} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Package className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>No production orders found</p>
              <p className="mt-1 text-xs">Adjust your filters or wait for orders to be paid</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Order</th>
                    <th className="px-4 py-3 text-left font-medium">Customer</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-center font-medium">Items</th>
                    <th className="px-4 py-3 text-center font-medium">Files</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-medium text-brand-primary hover:underline"
                        >
                          {order.order_number}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(order.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{order.customer.name ?? 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="secondary"
                          className={cn('text-xs', STATUS_COLORS[order.status] ?? 'bg-gray-100')}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium">{order.ready_item_count}</span>
                        <span className="text-muted-foreground">/{order.item_count}</span>
                        <p className="text-xs text-muted-foreground">ready</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {order.has_production_files ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            <span className="font-medium text-green-700">
                              {order.production_file_count}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 text-orange-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span className="text-xs">None</span>
                          </div>
                        )}
                        {order.latest_generated_at && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDateTime(order.latest_generated_at)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Generate */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            disabled={generatingId === order.id}
                            onClick={() => handleGenerate(order.id, order.order_number)}
                            title={order.has_production_files ? 'Regenerate production files' : 'Generate production files'}
                          >
                            {generatingId === order.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Printer className="h-3 w-3" />
                            )}
                            {order.has_production_files ? 'Regen' : 'Generate'}
                          </Button>

                          {/* Download ZIP */}
                          {order.has_production_files && (
                            <Button
                              size="sm"
                              className="gap-1.5 text-xs"
                              disabled={downloadingId === order.id}
                              onClick={() => handleDownload(order.id, order.order_number)}
                            >
                              {downloadingId === order.id ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                              ZIP
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {pages} · {total} orders
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help card */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="space-y-1 text-sm text-blue-800">
              <p className="font-semibold">How production file generation works</p>
              <ul className="list-inside list-disc space-y-1 text-xs">
                <li><strong>Generate</strong> — creates print-ready PDFs (300 DPI, with bleed) per order item. CSV orders produce one file per row.</li>
                <li><strong>ZIP Download</strong> — packages all files in the standard folder structure: <code>item_ProductName/filename.pdf</code> + <code>order_manifest.json</code>.</li>
                <li><strong>Batch Download</strong> — ZIPs all orders matching the current filter (max 50 orders).</li>
                <li><strong>Regen</strong> — overwrites existing files (use after design changes).</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
