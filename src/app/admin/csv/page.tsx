'use client'

import { useEffect, useState, useCallback, Fragment } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Download, Table, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import {
  PageHeader, SectionCard, FilterTabs, SearchInput,
  EmptyState, StatusBadge, SkeletonRows, Pagination,
} from '@/components/admin/AdminUI'
import type { CsvJobStatus } from '@/types'

interface CsvJobRow {
  id: string
  user_id: string
  original_filename: string | null
  row_count: number
  status: CsvJobStatus
  progress: number
  error_log: { row: number; error: string }[]
  created_at: string
  completed_at: string | null
  column_mapping: Record<string, string>
  profiles: { full_name: string | null; email: string | null } | null
}

interface PaginationState {
  page: number
  limit: number
  total: number
  pages: number
}

type StatusFilter = CsvJobStatus | ''

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'validated', label: 'Validated' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'error', label: 'Error' },
]

const STATUS_COLOR: Record<string, 'gray' | 'blue' | 'yellow' | 'green' | 'red'> = {
  uploaded: 'gray',
  validated: 'blue',
  processing: 'yellow',
  completed: 'green',
  error: 'red',
}

function fmt(dt: string) {
  return new Date(dt).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminCSVJobsPage() {
  const [jobs, setJobs] = useState<CsvJobRow[]>([])
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 20, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/admin/csv?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setJobs(data.jobs)
      setPagination(data.pagination)
    } catch {
      toast.error('Failed to load CSV jobs')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  useEffect(() => {
    const hasProcessing = jobs.some((j) => j.status === 'processing')
    if (!hasProcessing) return
    const interval = setInterval(fetchJobs, 5000)
    return () => clearInterval(interval)
  }, [jobs, fetchJobs])

  const processingCount = jobs.filter(j => j.status === 'processing').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="CSV Batch Jobs"
        description="Variable-data print jobs submitted by customers"
        actions={
          <div className="flex items-center gap-2">
            {processingCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                <RefreshCw className="h-3 w-3 animate-spin" />
                {processingCount} processing
              </span>
            )}
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {pagination.total.toLocaleString()} total
            </span>
            <button
              onClick={fetchJobs}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:border-gray-300"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search by filename…"
          className="flex-1 max-w-sm"
        />
        <FilterTabs
          options={STATUS_TABS}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1) }}
        />
      </div>

      {/* Table */}
      <SectionCard noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">File / Customer</th>
                <th className="hidden px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">Rows</th>
                <th className="hidden px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">Progress</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 lg:table-cell">Submitted</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={5} cols={6} />
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={Table} title="No CSV jobs found" description="Variable-data jobs will appear here once customers submit them" />
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const isExpanded = expandedId === job.id
                  const failedRows = job.error_log?.length ?? 0
                  const generatedCount = Math.round((job.progress / 100) * job.row_count)

                  return (
                    <Fragment key={job.id}>
                      <tr className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50">
                        <td className="px-5 py-3.5">
                          <p className="max-w-[200px] truncate font-medium text-gray-800">
                            {job.original_filename ?? 'Unnamed file'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {job.profiles?.full_name ?? job.profiles?.email ?? job.user_id.slice(0, 8)}
                          </p>
                        </td>
                        <td className="hidden px-5 py-3.5 text-center sm:table-cell">
                          <span className="font-mono text-xs text-gray-600">{job.row_count.toLocaleString()}</span>
                        </td>
                        <td className="hidden px-5 py-3.5 md:table-cell">
                          {job.status === 'processing' ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                                <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${job.progress}%` }} />
                              </div>
                              <span className="text-[10px] text-yellow-600 font-medium">{job.progress}%</span>
                            </div>
                          ) : (
                            <p className="text-center font-mono text-xs text-gray-500">
                              {generatedCount.toLocaleString()}
                              {failedRows > 0 && <span className="ml-1 text-red-500">({failedRows} err)</span>}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <StatusBadge
                            label={job.status}
                            color={STATUS_COLOR[job.status] ?? 'gray'}
                          />
                        </td>
                        <td className="hidden px-5 py-3.5 text-xs text-gray-400 lg:table-cell">
                          {fmt(job.created_at)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            {job.status === 'completed' && (
                              <a
                                href={`/api/csv/${job.id}/download`}
                                className="flex items-center gap-1 rounded-lg bg-brand-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-primary-dark shadow-sm transition-colors"
                              >
                                <Download className="h-3 w-3" /> ZIP
                              </a>
                            )}
                            {failedRows > 0 && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : job.id)}
                                className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                {failedRows}
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Error log expansion */}
                      {isExpanded && failedRows > 0 && (
                        <tr className="bg-red-50">
                          <td colSpan={6} className="px-6 py-4">
                            <h4 className="mb-2 text-xs font-semibold text-red-700 uppercase tracking-wide">{failedRows} Failed Rows</h4>
                            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-red-600">
                              {job.error_log.slice(0, 50).map((e, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 font-mono">Row {e.row}</span>
                                  <span>{e.error}</span>
                                </li>
                              ))}
                              {failedRows > 50 && <li className="italic text-gray-400">… and {failedRows - 50} more</li>}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={pagination.page}
          totalPages={pagination.pages}
          total={pagination.total}
          onPage={(p) => setPage(p)}
        />
      </SectionCard>
    </div>
  )
}
