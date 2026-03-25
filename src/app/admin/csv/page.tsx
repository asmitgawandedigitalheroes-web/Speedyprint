'use client'

import { useEffect, useState, useCallback, Fragment } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
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

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const STATUS_OPTIONS: (CsvJobStatus | '')[] = ['', 'uploaded', 'validated', 'processing', 'completed', 'error']

const STATUS_BADGE: Record<string, string> = {
  uploaded: 'bg-gray-100 text-gray-600',
  validated: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
}

function fmt(dt: string) {
  return new Date(dt).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminCSVJobsPage() {
  const [jobs, setJobs] = useState<CsvJobRow[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CsvJobStatus | ''>('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      })
      const res = await fetch(`/api/admin/csv?${params}`)
      if (!res.ok) throw new Error('Failed to load CSV jobs')
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

  // Auto-refresh jobs that are still processing
  useEffect(() => {
    const hasProcessing = jobs.some((j) => j.status === 'processing')
    if (!hasProcessing) return
    const interval = setInterval(fetchJobs, 5000)
    return () => clearInterval(interval)
  }, [jobs, fetchJobs])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchJobs()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">CSV Batch Jobs</h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            All variable-data print jobs submitted by customers.
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
          {pagination.total.toLocaleString()} total
        </span>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename…"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as CsvJobStatus | ''); setPage(1) }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === '' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-brand-text-muted hover:border-brand-primary hover:text-brand-primary"
        >
          Clear
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-brand-text-muted">
            <tr>
              <th className="px-4 py-3 text-left">File / Customer</th>
              <th className="px-4 py-3 text-left">Template</th>
              <th className="px-4 py-3 text-center">Rows</th>
              <th className="px-4 py-3 text-center">Generated</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Submitted</th>
              <th className="px-4 py-3 text-left">Completed</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-brand-text-muted">Loading…</td>
              </tr>
            )}
            {!loading && jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-brand-text-muted">No jobs found.</td>
              </tr>
            )}
            {!loading && jobs.map((job) => {
              const templateId = job.column_mapping?._template_id
              const isExpanded = expandedId === job.id
              const failedRows = job.error_log?.length ?? 0

              return (
                <Fragment key={job.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    {/* File + customer */}
                    <td className="px-4 py-3">
                      <p className="max-w-[200px] truncate font-medium text-brand-text">
                        {job.original_filename ?? 'Unnamed file'}
                      </p>
                      <p className="text-xs text-brand-text-muted">
                        {job.profiles?.full_name ?? job.profiles?.email ?? job.user_id.slice(0, 8)}
                      </p>
                    </td>

                    {/* Template link */}
                    <td className="px-4 py-3">
                      {templateId ? (
                        <Link
                          href={`/admin/products`}
                          className="text-xs text-brand-primary hover:underline"
                        >
                          View template ↗
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Row count */}
                    <td className="px-4 py-3 text-center font-mono text-sm">{job.row_count.toLocaleString()}</td>

                    {/* Generated count + progress */}
                    <td className="px-4 py-3 text-center">
                      {job.status === 'processing' ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full rounded-full bg-yellow-400" style={{ width: `${job.progress}%` }} />
                          </div>
                          <span className="text-xs text-yellow-600">{job.progress}%</span>
                        </div>
                      ) : (
                        <span className={`font-mono text-sm ${failedRows > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {Math.round((job.progress / 100) * job.row_count).toLocaleString()}
                          {failedRows > 0 && <span className="ml-1 text-xs text-red-500">({failedRows} err)</span>}
                        </span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {job.status}
                      </span>
                    </td>

                    {/* Submitted */}
                    <td className="px-4 py-3 text-xs text-brand-text-muted">{fmt(job.created_at)}</td>

                    {/* Completed */}
                    <td className="px-4 py-3 text-xs text-brand-text-muted">
                      {job.completed_at ? fmt(job.completed_at) : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {job.status === 'completed' && (
                          <a
                            href={`/api/csv/${job.id}/download`}
                            className="rounded bg-brand-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-primary/90"
                          >
                            ⬇ ZIP
                          </a>
                        )}
                        {failedRows > 0 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : job.id)}
                            className="rounded border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            {isExpanded ? 'Hide errors' : `${failedRows} errors`}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded error log row */}
                  {isExpanded && failedRows > 0 && (
                    <tr key={`${job.id}-errors`} className="bg-red-50">
                      <td colSpan={8} className="px-6 py-4">
                        <h4 className="mb-2 text-sm font-semibold text-red-700">Error Log — {failedRows} failed rows</h4>
                        <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-red-600">
                          {job.error_log.slice(0, 50).map((e, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 font-mono">Row {e.row}</span>
                              <span>{e.error}</span>
                            </li>
                          ))}
                          {failedRows > 50 && <li className="italic text-gray-400">… and {failedRows - 50} more rows.</li>}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-brand-text-muted">
            Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 hover:border-brand-primary"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-1.5 ${p === page ? 'bg-brand-primary text-white' : 'border border-gray-200 hover:border-brand-primary'}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 hover:border-brand-primary"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
