'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { DIVISIONS } from '@/lib/utils/constants'
import type { ProductGroup } from '@/types'

type DivisionFilter = 'all' | ProductGroup['division']

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<
    (ProductGroup & { template_count: number })[]
  >([])
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

        if (divisionFilter !== 'all') {
          query = query.eq('division', divisionFilter)
        }

        const { data, error } = await query

        if (error) throw error

        const productsWithCount = (data ?? []).map((p: any) => ({
          ...p,
          template_count: p.templates?.length ?? 0,
          templates: undefined,
        }))

        setProducts(productsWithCount)
      } catch (err) {
        console.error('Products fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [divisionFilter])

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product group?')) return
    setDeleting(productId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('product_groups')
        .delete()
        .eq('id', productId)

      if (error) throw error
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete product. It may have associated templates or orders.')
    } finally {
      setDeleting(null)
    }
  }

  const divisionTabs: { key: DivisionFilter; label: string }[] = [
    { key: 'all', label: 'All Divisions' },
    ...DIVISIONS.map((d) => ({ key: d.key as DivisionFilter, label: d.name })),
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product groups, templates, and pricing
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Division Filter Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/50 p-1">
        {divisionTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setDivisionFilter(tab.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              divisionFilter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-muted-foreground hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Division</th>
              <th className="px-4 py-3 text-center font-medium">Templates</th>
              <th className="px-4 py-3 text-center font-medium">
                Display Order
              </th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td colSpan={6} className="px-4 py-4">
                    <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
                  </td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const division = DIVISIONS.find(
                  (d) => d.key === product.division
                )

                return (
                  <tr key={product.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image_url || (product.images && product.images.length > 0) ? (
                          <img
                            src={product.image_url || product.images[0]}
                            alt={product.name}
                            className="h-10 w-10 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-gray-50 text-xs text-muted-foreground">
                            IMG
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {division?.name ?? product.division}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.template_count}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.display_order}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="secondary"
                        className={
                          product.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.push(
                              `/admin/products/${product.id}/edit`
                            )
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(product.id)}
                          disabled={deleting === product.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
