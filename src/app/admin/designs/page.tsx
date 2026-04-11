'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, Layers } from 'lucide-react'
import { toast } from 'sonner'
import {
  PageHeader, SectionCard, SearchInput,
  EmptyState, StatusBadge, SkeletonRows, Pagination,
} from '@/components/admin/AdminUI'

interface DesignRow {
  id: string
  user_id: string
  product_template_id: string | null
  name: string
  thumbnail_url: string | null
  is_saved_template: boolean
  created_at: string
  updated_at: string
  profiles: { full_name: string | null; email: string | null } | null
  product_templates: {
    name: string | null
    product_groups: { name: string | null } | null
  } | null
}

interface DesignsResponse {
  designs: DesignRow[]
  total: number
  page: number
  limit: number
  totalPages: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminDesignsPage() {
  const [data, setData] = useState<DesignsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchDesigns = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/designs?${params}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      toast.error('Failed to load designs')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchDesigns() }, [fetchDesigns])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Designs"
        description={`View and manage all customer designs${data ? ` — ${data.total} total` : ''}`}
      />

      <SearchInput
        value={search}
        onChange={(v) => { setSearch(v); setPage(1) }}
        placeholder="Search by design name…"
        className="max-w-sm"
      />

      <SectionCard noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Design</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">Customer</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 lg:table-cell">Product</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Type</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">Updated</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={6} cols={6} />
              ) : !data || data.designs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={Layers} title="No designs found" description="Customer designs will appear here once they use the editor" />
                  </td>
                </tr>
              ) : (
                data.designs.map((design) => (
                  <tr key={design.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {design.thumbnail_url ? (
                          <img
                            src={design.thumbnail_url}
                            alt={design.name}
                            className="h-10 w-10 rounded-lg border border-gray-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-[10px] text-gray-400">
                            N/A
                          </div>
                        )}
                        <p className="font-medium text-gray-800 max-w-[160px] truncate">{design.name}</p>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 md:table-cell">
                      <p className="text-sm text-gray-700">{design.profiles?.full_name ?? 'Unknown'}</p>
                      <p className="text-[11px] text-gray-400">{design.profiles?.email ?? '—'}</p>
                    </td>
                    <td className="hidden px-5 py-3.5 lg:table-cell">
                      <p className="text-sm text-gray-700">{design.product_templates?.product_groups?.name ?? '—'}</p>
                      <p className="text-[11px] text-gray-400">{design.product_templates?.name ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge
                        label={design.is_saved_template ? 'Template' : 'Design'}
                        color={design.is_saved_template ? 'blue' : 'gray'}
                      />
                    </td>
                    <td className="hidden px-5 py-3.5 text-xs text-gray-400 sm:table-cell">
                      {formatDate(design.updated_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {design.product_template_id && (
                        <Link
                          href={`/designer/${design.product_template_id}?designId=${design.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        >
                          Open <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onPage={(p) => setPage(p)}
          />
        )}
      </SectionCard>
    </div>
  )
}
