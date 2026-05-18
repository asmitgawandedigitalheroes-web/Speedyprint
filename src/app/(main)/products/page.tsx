import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProductCard } from '@/components/products/ProductCard'
import { DIVISIONS, SITE_URL } from '@/lib/utils/constants'
import type { Division, ProductGroup } from '@/types'

export const revalidate = 3600

const getProducts = unstable_cache(
  async (division?: string) => {
    const supabase = createAdminClient()
    let query = supabase
      .from('product_groups')
      .select('*, pricing_rules(rule_type, price_value, conditions)')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    if (division) query = query.eq('division', division)
    const { data, error } = await query
    return { data: data ?? [], error }
  },
  ['products-listing'],
  { revalidate: 3600, tags: ['products'] }
)

interface ProductsPageProps {
  searchParams: Promise<{ division?: string }>
}

export const metadata: Metadata = {
  title: 'Custom printing products',
  description:
    'Browse our full range of custom printing products — labels, vinyl stickers, acrylic signs, wooden plaques, race bibs, event tags, MTB boards, stamps, trophies and more.',
  alternates: { canonical: `${SITE_URL}/products` },
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { division } = await searchParams
  const activeDivision = division as Division | undefined
  const { data: products, error } = await getProducts(activeDivision)

  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="border-b border-gray-100 bg-brand-bg">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-bold text-brand-text">Our products</h1>
          <p className="mt-2 text-brand-text-muted">
            Browse our range of custom printing solutions.
          </p>

          {/* Division filter pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/products"
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                !activeDivision
                  ? 'bg-brand-primary text-white'
                  : 'border border-gray-200 bg-white text-brand-text hover:border-brand-primary hover:text-brand-primary'
              }`}
            >
              All
            </Link>
            {DIVISIONS.map((div) => (
              <Link
                key={div.key}
                href={`/products?division=${div.key}`}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeDivision === div.key
                    ? 'bg-brand-primary text-white'
                    : 'border border-gray-200 bg-white text-brand-text hover:border-brand-primary hover:text-brand-primary'
                }`}
              >
                {div.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Error state */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">Failed to load products. Please try again later.</p>
          </div>
        )}

        {/* Products grid */}
        {!error && products && products.length > 0 && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product: ProductGroup) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!error && (!products || products.length === 0) && (
          <div className="rounded-md border border-gray-100 bg-brand-bg p-16 text-center">
            <div className="mx-auto mb-4 h-1 w-8 bg-brand-primary" />
            <h3 className="font-heading text-lg font-semibold text-brand-text">No products available</h3>
            <p className="mt-2 text-sm text-brand-text-muted">
              {activeDivision
                ? 'No products found in this category. Try a different filter.'
                : 'Products are being added. Please check back soon.'}
            </p>
            {activeDivision && (
              <Link href="/products" className="mt-4 inline-block text-sm font-medium text-brand-primary hover:text-brand-primary-dark">
                View all products →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
