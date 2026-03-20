'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  LayoutGrid,
  List,
  Filter,
  X,
  Table,
  RefreshCw,
  Archive,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import {
  ORDER_STATUS_LABELS,
  ORDER_ITEM_STATUS_LABELS,
  DIVISIONS,
} from '@/lib/utils/constants'
import type { OrderStatus } from '@/types'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EnrichedOrder {
  id: string
  order_number: string
  status: OrderStatus
  created_at: string
  total: number
  item_count: number
  item_statuses: string[]
  proof_summary: { total: number; pending: number; approved: number; revision_requested: number }
  production_file_count: number
  production_latest_at: string | null
  ready_for_production: boolean
  has_pending_proof: boolean
  has_csv_order: boolean
  divisions: string[]
  product_types: string[]
  profile: { id: string; full_name: string | null; email: string | null; company_name: string | null } | null
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

interface OrderPipelineProps {
  showBulkActions?: boolean
  limit?: number
  showPagination?: boolean
  /** Initial filter overrides (used from URL params on page load) */
  initialStatus?: string
}

// ── Kanban column config ───────────────────────────────────────────────────────

const KANBAN_COLS = [
  { status: 'draft',           label: 'Quote',      color: 'border-gray-300 bg-gray-50' },
  { status: 'pending_payment', label: 'Pending Pay', color: 'border-yellow-300 bg-yellow-50' },
  { status: 'paid',            label: 'Ordered',     color: 'border-blue-300 bg-blue-50' },
  { status: 'in_production',   label: 'Production',  color: 'border-purple-300 bg-purple-50' },
  { status: 'completed',       label: 'Completed',   color: 'border-green-300 bg-green-50' },
  { status: 'cancelled',       label: 'Cancelled',   color: 'border-red-300 bg-red-50' },
] as const

// ── Main component ────────────────────────────────────────────────────────────

export function OrderPipeline({
  showBulkActions = true,
  limit = 20,
  showPagination = true,
  initialStatus,
}: OrderPipelineProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── View state ───────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [orders, setOrders] = useState<EnrichedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit, total: 0, totalPages: 0 })

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState(initialStatus ?? searchParams.get('status') ?? 'all')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [divisionFilter, setDivisionFilter] = useState(searchParams.get('division') ?? 'all')
  const [productTypeFilter, setProductTypeFilter] = useState('')
  const [readyFilter, setReadyFilter] = useState(searchParams.get('ready_for_production') === 'true')
  const [showFilters, setShowFilters] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Bulk actions ─────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  // ── Per-order actions ─────────────────────────────────────────────────────────
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // ── CSV viewer ────────────────────────────────────────────────────────────────
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] } | null>(null)

  // ── Fetch orders ──────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      if (divisionFilter !== 'all') params.set('division', divisionFilter)
      if (productTypeFilter) params.set('product_type', productTypeFilter)
      if (readyFilter) params.set('ready_for_production', 'true')

      const res = await fetch(`/api/admin/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data.orders ?? [])
      setPagination(data.pagination ?? { page: 1, limit, total: 0, totalPages: 0 })
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, dateFrom, dateTo, divisionFilter, productTypeFilter, readyFilter, limit])

  useEffect(() => { fetchOrders(1) }, [fetchOrders])

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearch(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => fetchOrders(1), 350)
  }

  // ── Bulk update ───────────────────────────────────────────────────────────────
  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0 || !bulkStatus) return
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/orders/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: selectedIds, status: bulkStatus }),
      })
      if (!res.ok) throw new Error('Bulk update failed')
      const data = await res.json()
      toast.success(data.message)
      setSelectedIds([])
      setBulkStatus('')
      fetchOrders(pagination.page)
    } catch {
      toast.error('Bulk update failed')
    } finally {
      setBulkLoading(false)
    }
  }

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const toggleAll = () =>
    setSelectedIds(selectedIds.length === orders.length ? [] : orders.map((o) => o.id))

  // ── Per-order: generate production files ──────────────────────────────────────
  const handleGenerate = async (e: React.MouseEvent, orderId: string, orderNum: string) => {
    e.stopPropagation()
    setGeneratingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/production`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formats: ['pdf'] }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(`Generation failed: ${data.error}`); return }
      toast.success(`${data.files_generated} file(s) generated for ${orderNum}`)
      fetchOrders(pagination.page)
    } catch { toast.error('Generation failed') }
    finally { setGeneratingId(null) }
  }

  // ── Per-order: download ZIP ───────────────────────────────────────────────────
  const handleDownloadZip = async (e: React.MouseEvent, orderId: string, orderNum: string) => {
    e.stopPropagation()
    setDownloadingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/files`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Download failed'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `${orderNum}_production.zip`; a.click(); URL.revokeObjectURL(url)
      toast.success(`Downloaded ${orderNum}_production.zip`)
    } catch { toast.error('Download failed') }
    finally { setDownloadingId(null) }
  }

  // ── CSV viewer ────────────────────────────────────────────────────────────────
  const handleViewCsv = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation()
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: items } = await supabase.from('order_items').select('csv_job_id').eq('order_id', orderId).not('csv_job_id', 'is', null)
      if (!items || items.length === 0) return
      const { data } = await supabase.from('csv_jobs').select('parsed_data').eq('id', items[0].csv_job_id!).single()
      if (data?.parsed_data && Array.isArray(data.parsed_data) && data.parsed_data.length > 0) {
        const rows = data.parsed_data as Record<string, string>[]
        const headers = Object.keys(rows[0])
        setCsvData({ headers, rows: rows.map((r) => headers.map((h) => r[h] ?? '')) })
      }
    } catch { toast.error('Failed to load CSV data') }
  }

  // ── Clear filters ─────────────────────────────────────────────────────────────
  const clearFilters = () => {
    setStatusFilter('all'); setSearch(''); setDateFrom(''); setDateTo('')
    setDivisionFilter('all'); setProductTypeFilter(''); setReadyFilter(false)
  }

  const hasActiveFilters = statusFilter !== 'all' || search || dateFrom || dateTo ||
    divisionFilter !== 'all' || productTypeFilter || readyFilter

  // ── Shared order row renderer ─────────────────────────────────────────────────
  const renderOrderRow = (order: EnrichedOrder) => {
    const statusInfo = ORDER_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS['draft']
    const isSelected = selectedIds.includes(order.id)

    return (
      <tr
        key={order.id}
        className={cn(
          'cursor-pointer border-b transition-colors hover:bg-muted/40',
          isSelected && 'bg-blue-50/60'
        )}
        onClick={() => router.push(`/admin/orders/${order.id}`)}
      >
        {showBulkActions && (
          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(order.id)} className="rounded border-gray-300" />
          </td>
        )}

        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-brand-primary">{order.order_number}</span>
            {order.ready_for_production && (
              <span title="Ready for Production" className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100">
                <Printer className="h-3 w-3 text-orange-600" />
              </span>
            )}
            {order.has_pending_proof && (
              <span title="Awaiting proof review" className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100">
                <Clock className="h-3 w-3 text-yellow-600" />
              </span>
            )}
            {order.has_csv_order && (
              <span title="CSV variable data order" className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
                <Table className="h-3 w-3 text-blue-600" />
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(order.created_at)}</p>
        </td>

        <td className="px-4 py-3">
          <p className="font-medium leading-tight">{order.profile?.full_name ?? 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">{order.profile?.email ?? ''}</p>
          {order.profile?.company_name && (
            <p className="text-[11px] text-muted-foreground">{order.profile.company_name}</p>
          )}
        </td>

        <td className="hidden px-4 py-3 sm:table-cell">
          <div className="flex flex-wrap gap-1">
            {order.divisions.map((d) => {
              const div = DIVISIONS.find((x) => x.key === d)
              return (
                <span key={d} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
                  {div?.name ?? d}
                </span>
              )
            })}
          </div>
        </td>

        <td className="px-4 py-3 text-center text-sm">{order.item_count}</td>

        <td className="px-4 py-3 text-center">
          <Badge variant="secondary" className={cn('text-xs', statusInfo.color)}>
            {statusInfo.label}
          </Badge>
          {/* Item-level status mini-bar */}
          {order.item_count > 0 && (
            <div className="mt-1 flex justify-center gap-0.5">
              {order.item_statuses.slice(0, 6).map((s, i) => {
                const info = ORDER_ITEM_STATUS_LABELS[s]
                return (
                  <span
                    key={i}
                    title={info?.label ?? s}
                    className={cn('h-1.5 w-1.5 rounded-full', info?.color.split(' ')[0] ?? 'bg-gray-300')}
                  />
                )
              })}
            </div>
          )}
        </td>

        <td className="px-4 py-3 text-center">
          {order.proof_summary.total > 0 ? (
            <div className="flex items-center justify-center gap-1">
              {order.proof_summary.approved > 0 && <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
              {order.proof_summary.revision_requested > 0 && <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />}
              {order.proof_summary.pending > 0 && <Clock className="h-3.5 w-3.5 text-blue-500" />}
              <span className="text-xs text-muted-foreground">
                {order.proof_summary.approved}/{order.proof_summary.total}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>

        <td className="px-4 py-3 text-center">
          {order.production_file_count > 0 ? (
            <span className="font-medium text-green-700">{order.production_file_count}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>

        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(order.total)}</td>

        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            {/* View detail */}
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => router.push(`/admin/orders/${order.id}`)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>

            {/* Generate production files */}
            <Button
              size="sm" variant="ghost"
              className={cn('h-7 px-2', order.ready_for_production && 'text-orange-600 hover:text-orange-700')}
              title="Generate production files"
              disabled={generatingId === order.id}
              onClick={(e) => handleGenerate(e, order.id, order.order_number)}
            >
              {generatingId === order.id
                ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                : <Printer className="h-3.5 w-3.5" />}
            </Button>

            {/* Download ZIP */}
            {order.production_file_count > 0 && (
              <Button
                size="sm" variant="ghost" className="h-7 px-2 text-blue-600 hover:text-blue-700"
                title="Download production ZIP"
                disabled={downloadingId === order.id}
                onClick={(e) => handleDownloadZip(e, order.id, order.order_number)}
              >
                {downloadingId === order.id
                  ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  : <Download className="h-3.5 w-3.5" />}
              </Button>
            )}

            {/* CSV viewer */}
            {order.has_csv_order && (
              <Button size="sm" variant="ghost" className="h-7 px-2" title="View CSV data" onClick={(e) => handleViewCsv(e, order.id)}>
                <FileText className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </td>
      </tr>
    )
  }

  // ── Kanban card renderer ──────────────────────────────────────────────────────
  const renderKanbanCard = (order: EnrichedOrder) => {
    const statusInfo = ORDER_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS['draft']
    return (
      <div
        key={order.id}
        className="cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
        onClick={() => router.push(`/admin/orders/${order.id}`)}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-brand-primary">{order.order_number}</span>
          <div className="flex gap-1">
            {order.ready_for_production && <span title="Ready for production"><Printer className="h-3.5 w-3.5 text-orange-500" /></span>}
            {order.has_pending_proof && <span title="Awaiting proof"><Clock className="h-3.5 w-3.5 text-yellow-500" /></span>}
          </div>
        </div>
        <p className="mt-1 text-xs font-medium text-gray-700 truncate">{order.profile?.full_name ?? 'Unknown'}</p>
        <p className="text-[11px] text-muted-foreground truncate">{order.profile?.email}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
          <span className="text-xs font-semibold">{formatCurrency(order.total)}</span>
        </div>
        {order.divisions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {order.divisions.map((d) => (
              <span key={d} className="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-500">{d}</span>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t pt-2">
          <span className="text-[11px] text-muted-foreground">
            {order.item_count} item{order.item_count !== 1 ? 's' : ''}
            {order.proof_summary.total > 0 && ` · ${order.proof_summary.approved}/${order.proof_summary.total} proofs`}
          </span>
          {order.production_file_count > 0 && (
            <span className="text-[11px] font-medium text-green-700">{order.production_file_count} files</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Order #, customer name or email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([v, { label }]) => (
              <SelectItem key={v} value={v}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* More Filters toggle */}
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[10px] text-white">!</span>
          )}
        </Button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}

        <div className="ml-auto flex gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border p-0.5">
            <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} className="h-7 px-2" onClick={() => setViewMode('list')}>
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant={viewMode === 'kanban' ? 'default' : 'ghost'} className="h-7 px-2" onClick={() => setViewMode('kanban')}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Refresh */}
          <Button variant="ghost" size="sm" onClick={() => fetchOrders(pagination.page)} className="h-7 px-2">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Expanded Filters ───────────────────────────────────────────────── */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Division</label>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All Divisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                {DIVISIONS.map((d) => (
                  <SelectItem key={d.key} value={d.key}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Product Type</label>
            <Input
              placeholder="e.g. Race Bib"
              value={productTypeFilter}
              onChange={(e) => setProductTypeFilter(e.target.value)}
              className="w-[160px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">From Date</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[145px]" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">To Date</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[145px]" />
          </div>

          <div className="flex items-center gap-2 pb-1">
            <input
              type="checkbox"
              id="ready-filter"
              checked={readyFilter}
              onChange={(e) => setReadyFilter(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="ready-filter" className="flex items-center gap-1.5 text-sm font-medium cursor-pointer">
              <Printer className="h-3.5 w-3.5 text-orange-500" />
              Ready for Production only
            </label>
          </div>
        </div>
      )}

      {/* ── Bulk Action Bar ────────────────────────────────────────────────── */}
      {showBulkActions && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-blue-800">{selectedIds.length} selected</span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Set status..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ORDER_STATUS_LABELS).map(([v, { label }]) => (
                <SelectItem key={v} value={v}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkUpdate} disabled={!bulkStatus || bulkLoading}>
            {bulkLoading ? 'Updating...' : 'Apply to Selected'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button>

          {/* Batch download selected */}
          <Button
            size="sm"
            variant="outline"
            className="ml-auto gap-1.5"
            onClick={async () => {
              for (const id of selectedIds) {
                const order = orders.find((o) => o.id === id)
                if (order && order.production_file_count > 0) {
                  await handleDownloadZip({ stopPropagation: () => {} } as any, id, order.order_number)
                }
              }
            }}
          >
            <Archive className="h-3.5 w-3.5" />
            Download ZIPs
          </Button>
        </div>
      )}

      {/* ── List View ─────────────────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs">
                {showBulkActions && (
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && selectedIds.length === orders.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Division</th>
                <th className="px-4 py-3 text-center font-medium">Items</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Proof</th>
                <th className="px-4 py-3 text-center font-medium">Files</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={showBulkActions ? 10 : 9} className="px-4 py-4">
                      <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={showBulkActions ? 10 : 9} className="px-4 py-14 text-center text-muted-foreground">
                    <Search className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    No orders found
                    {hasActiveFilters && (
                      <p className="mt-1 text-xs">
                        <button onClick={clearFilters} className="text-brand-primary hover:underline">Clear filters</button>
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                orders.map(renderOrderRow)
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Kanban View ──────────────────────────────────────────────────────── */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-4 pb-2">
            {KANBAN_COLS.map((col) => {
              const colOrders = orders.filter((o) => o.status === col.status)
              return (
                <div key={col.status} className={cn('w-64 shrink-0 rounded-xl border-2 p-3', col.color)}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{col.label}</h3>
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold text-gray-700">
                      {colOrders.length}
                    </span>
                  </div>
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-white/60" />)}
                    </div>
                  ) : colOrders.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">No orders</p>
                  ) : (
                    <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                      {colOrders.map(renderKanbanCard)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {showPagination && pagination.totalPages > 1 && viewMode === 'list' && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={pagination.page <= 1} onClick={() => fetchOrders(pagination.page - 1)}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="px-2 text-sm">Page {pagination.page} of {pagination.totalPages}</span>
            <Button size="sm" variant="outline" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchOrders(pagination.page + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── CSV Data Modal ────────────────────────────────────────────────────── */}
      {csvData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setCsvData(null)}>
          <div className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">CSV Variable Data</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-muted-foreground">{csvData.rows.length} rows</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setCsvData(null)}>✕</Button>
            </div>
            <div className="overflow-auto p-4" style={{ maxHeight: 'calc(80vh - 64px)' }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                    {csvData.headers.filter((h) => !h.startsWith('_')).map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {csvData.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                      {row.filter((_, j) => !csvData.headers[j]?.startsWith('_')).map((cell, j) => (
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
    </div>
  )
}
