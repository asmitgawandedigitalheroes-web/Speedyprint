'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Download, Package, RefreshCw, Archive, CheckCircle,
  Clock, Printer, AlertCircle, Filter, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import {
  PageHeader, SectionCard, FilterTabs, SearchInput,
  EmptyState, StatusBadge, SkeletonRows, Pagination,
} from '@/components/admin/AdminUI'

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

type StatusFilter = '' | 'paid' | 'in_production' | 'completed'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All Orders' },
  { value: 'paid', label: 'Paid' },
  { value: 'in_production', label: 'In Production' },
  { value: 'completed', label: 'Completed' },
]

const STATUS_COLOR: Record<string, 'blue' | 'purple' | 'green' | 'red' | 'gray'> = {
  paid: 'blue',
  in_production: 'purple',
  completed: 'green',
  cancelled: 'red',
}

export default function AdminProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const [filterStatus, setFilterStatus] = useState<StatusFilter>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [batchDownloading, setBatchDownloading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

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
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOrders(data.orders ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } catch {
      toast.error('Failed to load production orders')
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus, filterDateFrom, filterDateTo, debouncedSearch])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleGenerate = async (orderId: string, orderNum: string) => {
    setGeneratingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/production`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formats: ['pdf'] }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(`Generation failed: ${data.error || 'Unknown error'}`); return }
      if (data.errors?.length > 0) {
        toast.warning(`${data.files_generated} file(s) generated with ${data.errors.length} error(s)`)
      } else {
        toast.success(`${data.files_generated} file(s) generated for ${orderNum}`)
      }
      await fetchOrders()
    } catch {
      toast.error('Failed to generate files')
    } finally {
      setGeneratingId(null)
    }
  }

  const handleDownload = async (orderId: string, orderNum: string) => {
    setDownloadingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/files`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Failed to download'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${orderNum}_production.zip`; a.click()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${orderNum}_production.zip`)
    } catch {
      toast.error('Failed to download')
    } finally {
      setDownloadingId(null)
    }
  }

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
          limit: 50,
        }),
      })
      if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Batch download failed'); return }
      const orderCount = res.headers.get('X-Order-Count') ?? '?'
      const fileCount = res.headers.get('X-File-Count') ?? '?'
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const fileName = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'batch_production.zip'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = fileName; a.click()
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
    const id = toast.loading(`Updating ${selectedIds.length} orders…`)
    try {
      const res = await fetch('/api/admin/orders/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: selectedIds, status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Updated ${selectedIds.length} orders`, { id })
      setSelectedIds([])
      await fetchOrders()
    } catch {
      toast.error('Failed to update orders', { id })
    }
  }

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === orders.length ? [] : orders.map(o => o.id))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const pendingGenCount = orders.filter(o => !o.has_production_files).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Pipeline"
        description="Track orders, generate print files, and manage production"
        actions={
          <div className="flex items-center gap-2">
            {pendingGenCount > 0 && (
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                {pendingGenCount} need files
              </span>
            )}
            <button
              onClick={handleBatchDownload}
              disabled={batchDownloading}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:border-gray-300 disabled:opacity-60 transition-colors"
            >
              {batchDownloading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              Batch ZIP
            </button>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:border-gray-300"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        }
      />

      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <FilterTabs
          options={STATUS_TABS}
          value={filterStatus}
          onChange={(v) => { setFilterStatus(v); setPage(1) }}
        />
        <div className="flex items-center gap-2 ml-auto">
          <SearchInput
            value={searchQuery}
            onChange={(v) => { setSearchQuery(v); setPage(1) }}
            placeholder="Search order, customer…"
            className="w-56"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${showFilters ? 'border-brand-primary bg-brand-primary text-white shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-brand-primary hover:text-brand-primary hover:bg-red-50'}`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
      </div>

      {/* Date filters (collapsible) */}
      {showFilters && (
        <SectionCard>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Date From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }}
                className="h-9 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Date To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }}
                className="h-9 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <button
              onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setSearchQuery(''); setPage(1) }}
              className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-500 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </SectionCard>
      )}

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-semibold text-blue-800">{selectedIds.length} selected</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => handleBulkStatusUpdate('in_production')}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
            >
              Move to Production
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('completed')}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            >
              Mark Completed
            </button>
            <button onClick={() => setSelectedIds([])} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-100">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <SectionCard noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3.5 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === orders.length && orders.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Order</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">Customer</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="hidden px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">Items</th>
                <th className="hidden px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 lg:table-cell">Files</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={6} cols={7} />
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={Package} title="No production orders" description="Orders will appear here once customers pay" />
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50 ${selectedIds.includes(order.id) ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs font-bold text-brand-primary hover:underline">
                        {order.order_number}
                      </Link>
                      <p className="text-[11px] text-gray-400">{formatDateTime(order.created_at)}</p>
                    </td>
                    <td className="hidden px-5 py-3.5 md:table-cell">
                      <p className="font-medium text-gray-800 truncate max-w-[140px]">{order.customer.name ?? 'Guest'}</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{order.customer.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge
                        label={order.status.replace(/_/g, ' ')}
                        color={STATUS_COLOR[order.status] ?? 'gray'}
                      />
                    </td>
                    <td className="hidden px-5 py-3.5 text-center sm:table-cell">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                        {order.ready_item_count}<span className="text-gray-400">/</span>{order.item_count}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3.5 text-center lg:table-cell">
                      {order.has_production_files ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold">{order.production_file_count} files</span>
                          </div>
                          {order.latest_generated_at && (
                            <span className="text-[10px] text-gray-400">{formatDateTime(order.latest_generated_at)}</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-amber-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-medium">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Generate */}
                        <button
                          onClick={() => handleGenerate(order.id, order.order_number)}
                          disabled={generatingId === order.id}
                          title="Generate print files"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                          {generatingId === order.id
                            ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            : <Printer className="h-3.5 w-3.5" />}
                        </button>
                        {/* Download */}
                        <button
                          onClick={() => handleDownload(order.id, order.order_number)}
                          disabled={downloadingId === order.id || !order.has_production_files}
                          title="Download ZIP"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                          {downloadingId === order.id
                            ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            : <Download className="h-3.5 w-3.5" />}
                        </button>
                        {/* View */}
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="flex items-center gap-1 rounded-lg bg-brand-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-primary-dark shadow-sm transition-all"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={pages} total={total} onPage={(p) => setPage(p)} />
      </SectionCard>
    </div>
  )
}
