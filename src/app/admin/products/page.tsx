'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { DIVISIONS } from '@/lib/utils/constants'
import {
  PageHeader, SectionCard, FilterTabs, EmptyState,
  StatusBadge, SkeletonRows, ActionBtn,
} from '@/components/admin/AdminUI'
import type { ProductGroup } from '@/types'

type DivisionFilter = 'all' | ProductGroup['division']

const DIVISION_TABS: { value: DivisionFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...DIVISIONS.map((d) => ({ value: d.key as DivisionFilter, label: d.name })),
]

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<(ProductGroup & { template_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [divisionFilter, setDivisionFilter] = useState<DivisionFilter>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const supabase = createClient()
        let query = supabase
          .from('product_groups')
          .select('*, templates:product_templates(id)')
          .order('display_order', { ascending: true })
        if (divisionFilter !== 'all') query = query.eq('division', divisionFilter)
        const { data, error } = await query
        if (error) throw error
        setProducts((data ?? []).map((p: any) => ({
          ...p,
          template_count: p.templates?.length ?? 0,
          templates: undefined,
        })))
      } catch {
        toast.error('Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [divisionFilter])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product group? This cannot be undone.')) return
    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('product_groups').delete().eq('id', id)
      if (error) throw error
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast.success('Product deleted')
    } catch {
      toast.error('Failed to delete — it may have associated templates or orders.')
    } finally {
      setDeleting(null)
    }
  }

  const divisionName = (key: string) => DIVISIONS.find(d => d.key === key)?.name ?? key

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage product groups, templates, and pricing"
        actions={
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        }
      />

      {/* Division filter */}
      <FilterTabs
        options={DIVISION_TABS}
        value={divisionFilter}
        onChange={setDivisionFilter}
      />

      {/* Table */}
      <SectionCard noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Product</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Division</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Templates</th>
                <th className="hidden px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">Order</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={6} cols={6} />
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={Package} title="No products found" description="Add your first product group to get started" />
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {(product.image_url || (product.images && product.images.length > 0)) ? (
                          <img
                            src={product.image_url || product.images?.[0] || ''}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg border border-gray-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-[10px] font-medium text-gray-400">
                            IMG
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{product.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono truncate">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                        {divisionName(product.division)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gray-100 px-2 text-[11px] font-semibold text-gray-600">
                        {product.template_count}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3.5 text-center text-xs text-gray-500 sm:table-cell">
                      {product.display_order}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge
                        label={product.is_active ? 'Active' : 'Inactive'}
                        color={product.is_active ? 'green' : 'gray'}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <ActionBtn
                          onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                          icon={Pencil}
                          label="Edit"
                          variant="ghost"
                        />
                        <ActionBtn
                          onClick={() => handleDelete(product.id)}
                          icon={Trash2}
                          label="Delete"
                          variant="ghost"
                          danger
                          disabled={deleting === product.id}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
