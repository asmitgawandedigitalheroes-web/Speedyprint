'use client'

import { useState, useEffect } from 'react'
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatTimeAgo } from '@/lib/utils/format'
import Link from 'next/link'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [adminFilter, setAdminFilter] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
      })
      if (search) params.set('search', search)
      if (actionFilter) params.set('action', actionFilter)
      if (adminFilter) params.set('isAdminAction', adminFilter)

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setCount(data.count || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter, adminFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  const getActionBadge = (action: string) => {
    const critical = ['order_placed', 'site_settings_updated', 'user_role_updated']
    const medium = ['order_status_updated', 'proof_created', 'proof_approved']
    
    if (critical.includes(action)) return 'bg-red-100 text-red-700 border-red-200'
    if (medium.includes(action)) return 'bg-blue-100 text-blue-700 border-blue-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Audit Logs</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Comprehensive history of all system activities and administrative actions.
          </p>
        </div>
        <Button onClick={() => fetchLogs()} variant="outline" size="sm" className="h-9">
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-[#E7E5E4] bg-white shadow-sm overflow-hidden">
        {/* Filters Header */}
        <div className="border-b border-[#E7E5E4] bg-[#FAFAFA] px-6 py-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
              <Input
                placeholder="Search by order # or metadata..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Type:</label>
              <select
                value={adminFilter}
                onChange={(e) => { setAdminFilter(e.target.value); setPage(1) }}
                className="h-9 rounded-md border border-[#E7E5E4] bg-white px-3 text-sm focus:border-brand-primary focus:outline-none"
              >
                <option value="">All Actions</option>
                <option value="true">Admin/Staff Only</option>
                <option value="false">User Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">Event:</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
                className="h-9 rounded-md border border-[#E7E5E4] bg-white px-3 text-sm focus:border-brand-primary focus:outline-none"
              >
                <option value="">Any Event</option>
                <option value="order_placed">Order Placed</option>
                <option value="order_status_updated">Order Status Changed</option>
                <option value="proof_created">Proof Generated</option>
                <option value="proof_approved">Proof Approved</option>
                <option value="design_created">Design Saved</option>
                <option value="site_settings_updated">Settings Updated</option>
              </select>
            </div>

            <Button type="submit" size="sm" className="bg-brand-primary text-white hover:bg-brand-primary-dark">
              Filter
            </Button>
          </form>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#E7E5E4] bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4 text-right">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8">
                      <div className="h-4 bg-gray-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-brand-text-muted">
                    <ClipboardList className="mx-auto h-10 w-10 text-gray-200 mb-3" />
                    <p>No audit logs found matching the criteria.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-brand-text">{formatDateTime(log.created_at)}</span>
                        <span className="text-[10px] text-brand-text-muted">{formatTimeAgo(log.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-gray-200">
                          {log.is_admin_action ? 'A' : 'U'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-brand-text truncate max-w-[140px]">
                            {log.profile?.full_name || 'System / Guest'}
                          </span>
                          <span className="text-[10px] text-brand-text-muted truncate max-w-[140px]">
                            {log.profile?.email || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", getActionBadge(log.action))}>
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-brand-text capitalize">{log.entity_type}</span>
                        <span className="text-[10px] text-brand-text-muted font-mono">{log.entity_id?.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                        {log.metadata?.order_number && (
                          <Badge variant="outline" className="text-[10px] bg-white">#{log.metadata.order_number}</Badge>
                        )}
                        {log.metadata?.status && (
                          <span className="text-[10px] text-brand-text-muted">Status: <span className="font-bold text-brand-text">{log.metadata.status}</span></span>
                        )}
                        {log.metadata?.name && (
                          <span className="text-[10px] text-brand-text-muted italic truncate block max-w-[150px]">"{log.metadata.name}"</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(log.entity_type === 'order' || log.metadata?.order_id) && (
                        <Link
                          href={`/admin/orders/${log.entity_id || log.metadata.order_id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-text-muted hover:bg-white hover:text-brand-primary border border-transparent hover:border-brand-primary/20 transition-all shadow-sm"
                          title="View Order Details"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-[#E7E5E4] bg-white px-6 py-3">
          <p className="text-xs text-brand-text-muted">
            Showing <span className="font-bold text-brand-text">{logs.length}</span> of{' '}
            <span className="font-bold text-brand-text">{count}</span> logs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-bold text-brand-text">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
