'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils/format'
import { CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'

type ProofRow = {
  id: string
  version: number
  status: string
  created_at: string
  responded_at: string | null
  customer_notes: string | null
  admin_notes: string | null
  proof_file_url: string | null
  order_item: {
    id: string
    status: string
    order: { id: string; order_number: string }
    product_group: { name: string } | null
    product_template: { name: string } | null
  } | null
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  revision_requested: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
}

const STATUS_ICON: Record<string, React.FC<{ className?: string }>> = {
  pending: Clock,
  approved: CheckCircle,
  revision_requested: AlertCircle,
  rejected: AlertCircle,
}

export default function AdminProofsPage() {
  const [proofs, setProofs] = useState<ProofRow[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const fetchProofs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/proofs?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setProofs(data.proofs)
      // API returns flat { total, page, limit } — compute pages locally
      const total = data.total ?? 0
      const limit = data.limit ?? 20
      setPagination({ page: data.page ?? 1, limit, total, pages: Math.ceil(total / limit) || 1 })
    } catch {
      toast.error('Failed to load proofs')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { fetchProofs() }, [fetchProofs])

  // Auto-refresh if there are pending proofs
  useEffect(() => {
    const hasPending = proofs.some((p) => p.status === 'pending')
    if (!hasPending) return
    const interval = setInterval(fetchProofs, 30000)
    return () => clearInterval(interval)
  }, [proofs, fetchProofs])

  const pendingCount = proofs.filter((p) => p.status === 'pending').length
  const revisionCount = proofs.filter((p) => p.status === 'revision_requested').length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Proof Management</h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Review and manage digital proofs across all orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              {pendingCount} awaiting customer review
            </span>
          )}
          {revisionCount > 0 && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
              {revisionCount} revision{revisionCount > 1 ? 's' : ''} requested
            </span>
          )}
          <button
            onClick={fetchProofs}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:border-brand-primary hover:text-brand-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        {['', 'pending', 'revision_requested', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              statusFilter === s
                ? 'bg-brand-primary text-white'
                : 'border border-gray-200 bg-white text-brand-text-muted hover:border-brand-primary hover:text-brand-primary'
            }`}
          >
            {s === '' ? 'All' :
             s === 'pending' ? 'Awaiting Review' :
             s === 'revision_requested' ? 'Revision Requested' :
             s === 'approved' ? 'Approved' : 'Rejected'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-brand-text-muted">
            <tr>
              <th className="px-4 py-3 text-left">Order / Product</th>
              <th className="px-4 py-3 text-center">Version</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Customer Notes</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">Responded</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-brand-text-muted">
                  Loading&hellip;
                </td>
              </tr>
            )}
            {!loading && proofs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-brand-text-muted">
                  No proofs found.
                </td>
              </tr>
            )}
            {!loading && proofs.map((proof) => {
              const StatusIcon = STATUS_ICON[proof.status] ?? Clock
              return (
                <tr key={proof.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {proof.order_item?.order ? (
                      <>
                        <Link
                          href={`/admin/orders/${proof.order_item.order.id}`}
                          className="font-medium text-brand-text hover:text-brand-primary hover:underline"
                        >
                          {proof.order_item.order.order_number}
                        </Link>
                        <p className="text-xs text-brand-text-muted">
                          {proof.order_item.product_group?.name ?? '—'}
                          {proof.order_item.product_template?.name ? ` — ${proof.order_item.product_template.name}` : ''}
                        </p>
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      v{proof.version}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[proof.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      <StatusIcon className="h-3 w-3" />
                      {proof.status === 'pending' ? 'Awaiting Review' :
                       proof.status === 'revision_requested' ? 'Revision Needed' :
                       proof.status.charAt(0).toUpperCase() + proof.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {proof.customer_notes ? (
                      <p className="max-w-[200px] truncate text-xs italic text-brand-text-muted">
                        &ldquo;{proof.customer_notes}&rdquo;
                      </p>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-text-muted">
                    {formatDateTime(proof.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-text-muted">
                    {proof.responded_at ? formatDateTime(proof.responded_at) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {proof.proof_file_url && (
                        <a
                          href={proof.proof_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
                        >
                          View PDF
                        </a>
                      )}
                      {proof.order_item?.order && (
                        <Link
                          href={`/admin/orders/${proof.order_item.order.id}`}
                          className="rounded bg-brand-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-primary/90"
                        >
                          Order &rarr;
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-brand-text-muted">
            Showing {((page - 1) * pagination.limit) + 1}&ndash;{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 hover:border-brand-primary"
            >
              &larr; Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40 hover:border-brand-primary"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
