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
  ChevronDown,
  Search,
  MoreVertical,
  LayoutGrid,
  List,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '../../../components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
  paid: 'bg-green-100 text-green-700',
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
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Per-order generate + download state
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Batch download state
  const [batchDownloading, setBatchDownloading] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (filterStatus) params.set('status', filterStatus)
      if (filterDateFrom) params.set('dateFrom', filterDateFrom)
      if (filterDateTo) params.set('dateTo', filterDateTo)
      if (debouncedSearch) params.set('q', debouncedSearch)

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

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedIds.length === 0) return
    const loadingToast = toast.loading(`Updating ${selectedIds.length} orders...`)
    try {
      const res = await fetch('/api/admin/orders/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: selectedIds, status: newStatus }),
      })
      if (!res.ok) throw new Error('Bulk update failed')
      toast.success(`Successfully updated ${selectedIds.length} orders`, { id: loadingToast })
      setSelectedIds([])
      await fetchOrders()
    } catch {
      toast.error('Failed to update orders', { id: loadingToast })
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(orders.map((o: ProductionOrder) => o.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const readyCount = orders.filter((o) => o.has_production_files).length
  const pendingCount = orders.filter((o) => !o.has_production_files).length

  return (
    <div className="space-y-6 text-brand-text">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold">Production Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track orders, variable data, and print-ready files
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* Pipeline Stages & Search */}
          <Tabs
            value={filterStatus || 'all'}
            onValueChange={(v) => {
              setFilterStatus(v === 'all' ? '' : v)
              setPage(1)
            }}
            className="w-full"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="all" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  All Stages
                </TabsTrigger>
                <TabsTrigger value="paid" className="gap-2">
                  Paid
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    {orders.filter(o => o.status === 'paid').length || ''}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="in_production" className="gap-2">
                  In Production
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  Completed
                </TabsTrigger>
              </TabsList>

              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Order #, Customer, Email..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </Tabs>

          {/* Orders Table */}
          <Card className="border-brand-primary/10 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-base font-semibold">
                    Orders
                    <span className="ml-2 font-mono text-sm font-normal text-muted-foreground opacity-60">
                      ({total})
                    </span>
                  </CardTitle>

                  {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 border-l pl-4">
                      <span className="text-[11px] font-bold text-brand-primary">
                        {selectedIds.length} SELECTED
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="default" className="h-7 px-3 text-[10px] uppercase font-bold">
                            Bulk Action
                            <ChevronDown className="ml-1 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[180px]">
                          <DropdownMenuLabel className="text-[10px] uppercase opacity-50">Move Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleBulkStatusUpdate('in_production')} className="text-xs">
                            <Clock className="h-3.5 w-3.5 mr-2" />
                            Move to Production
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkStatusUpdate('completed')} className="text-xs">
                            <CheckCircle className="h-3.5 w-3.5 mr-2 text-green-600" />
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs text-red-600" onClick={() => setSelectedIds([])}>
                            Clear Selection
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={fetchOrders} className="h-8 gap-2 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="mx-auto h-8 w-8 animate-spin text-brand-primary opacity-20" />
                  <p className="mt-3 text-xs text-muted-foreground uppercase tracking-widest font-bold">Processing Pipeline...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-24 text-center">
                  <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-10" />
                  <p className="text-sm font-medium text-muted-foreground">Dashboard Clear</p>
                  <p className="mt-1 text-[10px] text-muted-foreground opacity-60 uppercase">No active orders in this segment</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="w-[48px] px-4 py-3">
                          <Checkbox
                            checked={selectedIds.length === orders.length && orders.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="px-4 py-3 text-left font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Order Ref</th>
                        <th className="px-4 py-3 text-left font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Customer</th>
                        <th className="px-4 py-3 text-center font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-center font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Items</th>
                        <th className="px-4 py-3 text-center font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Production</th>
                        <th className="px-4 py-3 text-right font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className={cn(
                            'transition-colors hover:bg-muted/50',
                            selectedIds.includes(order.id) && 'bg-brand-primary/5'
                          )}
                        >
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={selectedIds.includes(order.id)}
                              onCheckedChange={() => toggleSelect(order.id)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="font-mono font-bold text-brand-primary hover:underline hover:text-brand-dark"
                            >
                              {order.order_number}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                              <span className="text-[9px] text-muted-foreground font-mono">
                                {formatDateTime(order.created_at)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold truncate max-w-[150px]">{order.customer.name ?? 'Guest User'}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{order.customer.email}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant="outline"
                              className={cn('text-[9px] uppercase font-black px-2 py-0 border-none rounded-sm', STATUS_COLORS[order.status] ?? 'bg-gray-100')}
                            >
                              {order.status.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-1 rounded-sm bg-gray-100 px-2 py-0.5 text-[11px]">
                              <span className="font-black">{order.ready_item_count}</span>
                              <span className="opacity-30">/</span>
                              <span className="opacity-60">{order.item_count}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {order.has_production_files ? (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1.5 text-green-600 font-black">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>{order.production_file_count}</span>
                                </div>
                                {order.latest_generated_at && (
                                  <p className="mt-0.5 text-[8px] text-muted-foreground uppercase font-medium">
                                    {formatDateTime(order.latest_generated_at)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5 text-amber-600 animate-pulse">
                                <Clock className="h-3 w-3" />
                                <span className="text-[10px] font-bold uppercase">Ready</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 border-none hover:bg-muted"
                                onClick={() => handleGenerate(order.id, order.order_number)}
                                disabled={generatingId === order.id}
                                title="Regenerate Files"
                              >
                                {generatingId === order.id ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-primary" />
                                ) : (
                                  <Printer className="h-3.5 w-3.5 opacity-60" />
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 border-none hover:bg-muted"
                                onClick={() => handleDownload(order.id, order.order_number)}
                                disabled={downloadingId === order.id || !order.has_production_files}
                                title="Download Files"
                              >
                                {downloadingId === order.id ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-primary" />
                                ) : (
                                  <Download className="h-3.5 w-3.5 opacity-60" />
                                )}
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                    <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px]">
                                  <DropdownMenuLabel className="text-[10px] uppercase opacity-50">Quick Actions</DropdownMenuLabel>
                                  <DropdownMenuItem asChild className="text-xs">
                                    <Link href={`/admin/orders/${order.id}`}>View Details</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('completed')} className="text-xs">
                                    Mark Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-xs text-red-600">
                                    Cancel Pipeline
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                <div className="flex items-center justify-between border-t px-4 py-4 bg-muted/10">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                    Page {page} of {pages} · Total orders {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-[10px] uppercase font-bold"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-[10px] uppercase font-bold"
                      disabled={page >= pages}
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    >
                      Next
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Controls */}
        <div className="w-full space-y-6 lg:w-80">
          <Button
            className="w-full h-auto flex-col items-start gap-1 p-6 bg-brand-primary hover:bg-brand-dark shadow-xl active:scale-[0.98] transition-all"
            onClick={handleBatchDownload}
            disabled={batchDownloading}
          >
            {batchDownloading ? (
              <RefreshCw className="h-6 w-6 animate-spin mb-2" />
            ) : (
              <Archive className="h-6 w-6 mb-2" />
            )}
            <p className="text-sm font-black uppercase tracking-tight">Export Batch ZIP</p>
            <p className="text-[9px] opacity-70 font-medium">Download current list (Up to 50)</p>
          </Button>

          <Card className="border-brand-primary/10">
            <CardHeader className="pb-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-brand-primary" />
                <CardTitle className="text-[11px] font-black uppercase tracking-widest">Global Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Production Period</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    className="h-8 text-[10px] border-muted bg-muted/20"
                    value={filterDateFrom}
                    onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }}
                  />
                  <Input
                    type="date"
                    className="h-8 text-[10px] border-muted bg-muted/20"
                    value={filterDateTo}
                    onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Search Category</Label>
                <div className="relative">
                  <Input
                    placeholder="Search Products..."
                    className="h-8 pl-8 text-xs border-muted bg-muted/20"
                    value={filterProduct}
                    onChange={(e) => { setFilterProduct(e.target.value); setPage(1) }}
                  />
                  <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              <div className="pt-3 flex flex-col gap-2">
                <Button size="sm" onClick={fetchOrders} className="w-full h-8 text-[10px] uppercase font-black tracking-widest">
                  Update Pipeline
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-8 text-[9px] font-bold uppercase tracking-widest text-muted-foreground"
                  onClick={() => {
                    setFilterStatus('')
                    setFilterDateFrom('')
                    setFilterDateTo('')
                    setFilterProduct('')
                    setSearchQuery('')
                    setPage(1)
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Shortcuts / Insights */}
          <Card className="border-blue-100 bg-blue-50/10">
            <CardContent className="p-4 flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-blue-100 text-blue-600">
                <AlertCircle className="h-3.5 w-3.5" />
              </div>
              <div className="text-[10px] leading-relaxed text-blue-900/60 font-medium">
                <span className="font-black text-blue-900 block mb-1 uppercase tracking-tight">Production Status</span>
                Orders only enter the pipeline after successful payment. Proof approvals trigger production-ready status.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
