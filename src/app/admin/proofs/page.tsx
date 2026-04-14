'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils/format'
import { CheckCircle2, Clock, AlertCircle, RefreshCw, FileText, ExternalLink } from 'lucide-react'
import {
  PageHeader, SectionCard, FilterTabs, EmptyState,
  StatusBadge, SkeletonRows, Pagination,
} from '@/components/admin/AdminUI'

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

const STATUS_COLOR: Record<string, 'blue' | 'green' | 'yellow' | 'red' | 'gray'> = {
  pending: 'blue',
  approved: 'green',
  revision_requested: 'yellow',
  rejected: 'red',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting Review',
  approved: 'Approved',
  revision_requested: 'Revision Needed',
  rejected: 'Rejected',
}

const STATUS_ICON: Record<string, React.ElementType> = {
  pending: Clock,
  approved: CheckCircle2,
  revision_requested: AlertCircle,
  rejected: AlertCircle,
}

type StatusFilter = '' | 'pending' | 'revision_requested' | 'approved' | 'rejected'

export default function AdminProofsPage() {
  const [proofs, setProofs] = useState<ProofRow[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [page, setPage] = useState(1)

  const fetchProofs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/proofs?${params}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setProofs(data.proofs ?? [])
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

  useEffect(() => {
    const hasPending = proofs.some(p => p.status === 'pending')
    if (!hasPending) return
    const interval = setInterval(fetchProofs, 30000)
    return () => clearInterval(interval)
  }, [proofs, fetchProofs])

  const pendingCount = proofs.filter(p => p.status === 'pending').length
  const revisionCount = proofs.filter(p => p.status === 'revision_requested').length

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: '', label: 'All Proofs' },
    { value: 'pending', label: 'Awaiting Review' },
    { value: 'revision_requested', label: 'Revision Needed' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proof Management"
        description="Review and manage digital proofs across all orders"
        actions={
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {pendingCount} awaiting review
              </span>
            )}
            {revisionCount > 0 && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                {revisionCount} revision{revisionCount > 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={fetchProofs}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        }
      />

      {/* Filters */}
      <FilterTabs
        options={filterOptions}
        value={statusFilter}
        onChange={(v) => { setStatusFilter(v); setPage(1) }}
      />

      {/* Table */}
      <SectionCard noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Order / Product</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Ver.</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">Customer Notes</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 lg:table-cell">Created</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={6} cols={6} />
              ) : proofs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={FileText} title="No proofs found" description="Proofs will appear here once customers submit orders with designs" />
                  </td>
                </tr>
              ) : (
                proofs.map((proof) => {
                  const StatusIcon = STATUS_ICON[proof.status] ?? Clock
                  const color = STATUS_COLOR[proof.status] ?? 'gray'
                  return (
                    <tr key={proof.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        {proof.order_item?.order ? (
                          <>
                            <Link href={`/admin/orders/${proof.order_item.order.id}`} className="font-mono text-xs font-bold text-brand-primary hover:underline">
                              {proof.order_item.order.order_number}
                            </Link>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {proof.order_item.product_group?.name ?? '—'}
                              {proof.order_item.product_template?.name ? ` · ${proof.order_item.product_template.name}` : ''}
                            </p>
                          </>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                          v{proof.version}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <StatusIcon className={`h-3.5 w-3.5 ${color === 'blue' ? 'text-blue-500' : color === 'green' ? 'text-green-500' : color === 'yellow' ? 'text-yellow-500' : 'text-red-500'}`} />
                          <StatusBadge label={STATUS_LABEL[proof.status] ?? proof.status} color={color} />
                        </div>
                      </td>
                      <td className="hidden px-5 py-3.5 md:table-cell">
                        {proof.customer_notes
                          ? <p className="max-w-[180px] truncate text-xs italic text-gray-500">"{proof.customer_notes}"</p>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="hidden px-5 py-3.5 text-xs text-gray-400 lg:table-cell">
                        {formatDateTime(proof.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {proof.proof_file_url && (
                            <a href={proof.proof_file_url} target="_blank" rel="noopener noreferrer"
                              className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50">
                              PDF
                            </a>
                          )}
                          {proof.order_item?.order && (
                            <Link href={`/admin/orders/${proof.order_item.order.id}`}
                              className="flex items-center gap-1 rounded-lg bg-brand-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-primary-dark shadow-sm transition-colors">
                              Order <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
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
