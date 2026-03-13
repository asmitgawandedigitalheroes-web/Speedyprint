'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants'
import type { Order, Profile, OrderStatus } from '@/types'

interface OrderWithProfile extends Omit<Order, 'profile'> {
  profile: Pick<Profile, 'id' | 'full_name' | 'email' | 'company_name'> | null
  item_count: number
}

interface OrderPipelineProps {
  showBulkActions?: boolean
  limit?: number
  showPagination?: boolean
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function OrderPipeline({
  showBulkActions = true,
  limit = 20,
  showPagination = true,
}: OrderPipelineProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        })
        if (statusFilter !== 'all') params.set('status', statusFilter)
        if (search) params.set('search', search)
        if (dateFrom) params.set('date_from', dateFrom)
        if (dateTo) params.set('date_to', dateTo)

        const res = await fetch(`/api/admin/orders?${params}`)
        if (!res.ok) throw new Error('Failed to fetch orders')

        const data = await res.json()
        setOrders(data.orders)
        setPagination(data.pagination)
      } catch (err) {
        console.error('Failed to fetch orders:', err)
      } finally {
        setLoading(false)
      }
    },
    [statusFilter, search, dateFrom, dateTo, limit]
  )

  useEffect(() => {
    fetchOrders(1)
  }, [fetchOrders])

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
      setSelectedIds([])
      setBulkStatus('')
      fetchOrders(pagination.page)
    } catch (err) {
      console.error('Bulk update error:', err)
    } finally {
      setBulkLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(orders.map((o) => o.id))
    }
  }

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...Object.entries(ORDER_STATUS_LABELS).map(([value, { label }]) => ({
      value,
      label,
    })),
  ]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-[160px]"
          placeholder="From date"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-[160px]"
          placeholder="To date"
        />
      </div>

      {/* Bulk Actions */}
      {showBulkActions && selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.length} selected
          </span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Set status..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleBulkUpdate}
            disabled={!bulkStatus || bulkLoading}
          >
            {bulkLoading ? 'Updating...' : 'Apply'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds([])}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {showBulkActions && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      orders.length > 0 &&
                      selectedIds.length === orders.length
                    }
                    onChange={toggleAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left font-medium">Order #</th>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-center font-medium">Items</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td colSpan={showBulkActions ? 8 : 7} className="px-4 py-4">
                    <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={showBulkActions ? 8 : 7}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const statusInfo =
                  ORDER_STATUS_LABELS[order.status] ??
                  ORDER_STATUS_LABELS['draft']

                return (
                  <tr
                    key={order.id}
                    className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    {showBulkActions && (
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono font-medium">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {order.profile?.full_name ?? 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.profile?.email ?? ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.item_count}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          statusInfo.color
                        )}
                      >
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/orders/${order.id}`)
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} orders
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => fetchOrders(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="px-2 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchOrders(pagination.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
