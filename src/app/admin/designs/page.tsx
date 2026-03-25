'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, ExternalLink, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DesignRow {
  id: string
  user_id: string
  product_template_id: string | null
  name: string
  thumbnail_url: string | null
  is_saved_template: boolean
  created_at: string
  updated_at: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profiles: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product_templates: any
}

interface DesignsResponse {
  designs: DesignRow[]
  total: number
  page: number
  limit: number
  totalPages: number
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
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Failed to fetch designs:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchDesigns()
  }, [fetchDesigns])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchDesigns()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Designs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all user designs
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by design name..."
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {/* Stats */}
      {data && (
        <p className="text-sm text-muted-foreground">
          {data.total} design{data.total !== 1 ? 's' : ''} total
        </p>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Preview</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.designs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No designs found
                  </TableCell>
                </TableRow>
              ) : (
                data?.designs.map((design) => (
                  <TableRow key={design.id}>
                    <TableCell>
                      {design.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={design.thumbnail_url}
                          alt={design.name}
                          className="h-10 w-10 rounded border object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded border bg-gray-50 text-xs text-gray-400">
                          N/A
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{design.name}</div>
                      {design.is_saved_template && (
                        <span className="text-xs text-blue-600">Template</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {design.profiles?.full_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {design.profiles?.email || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {design.product_templates?.product_groups?.name || '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {design.product_templates?.name || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(design.updated_at)}
                    </TableCell>
                    <TableCell>
                      {design.product_template_id && (
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/designer/${design.product_template_id}?designId=${design.id}`}
                            target="_blank"
                            title="Open in Designer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
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
