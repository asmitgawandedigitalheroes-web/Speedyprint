import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/ProductCard'
import { DIVISIONS } from '@/lib/utils/constants'
import type { Division, ProductGroup } from '@/types'

interface ProductsPageProps {
  searchParams: Promise<{ division?: string }>
}

export const metadata = {
  title: 'Products | SpeedyPrint',
  description: 'Browse our range of custom printing products across all divisions.',
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { division } = await searchParams
  const activeDivision = division as Division | undefined
  const supabase = await createClient()

  let query = supabase
    .from('product_groups')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (activeDivision) {
    query = query.eq('division', activeDivision)
  }

  const { data: products, error } = await query

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-black">Products</h1>
        <p className="mt-2 text-brand-gray-medium">
          Browse our range of custom printing products
        </p>
      </div>

      {/* Division filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/products"
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            !activeDivision
              ? 'bg-brand-red text-white'
              : 'bg-brand-bg text-brand-gray hover:bg-brand-gray-light'
          }`}
        >
          All
        </Link>
        {DIVISIONS.map((div) => (
          <Link
            key={div.key}
            href={`/products?division=${div.key}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeDivision === div.key
                ? 'bg-brand-red text-white'
                : 'bg-brand-bg text-brand-gray hover:bg-brand-gray-light'
            }`}
          >
            {div.name}
          </Link>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">
            Failed to load products. Please try again later.
          </p>
        </div>
      )}

      {/* Products grid */}
      {!error && products && products.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product: ProductGroup) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!error && (!products || products.length === 0) && (
        <div className="rounded-lg border border-brand-gray-light bg-brand-bg p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-gray-light">
            <svg
              className="h-8 w-8 text-brand-gray-medium"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-brand-black">
            No products available
          </h3>
          <p className="mt-2 text-brand-gray-medium">
            {activeDivision
              ? 'No products found in this division. Try selecting a different category.'
              : 'Products are being added. Please check back soon.'}
          </p>
          {activeDivision && (
            <Link
              href="/products"
              className="mt-4 inline-block text-sm font-medium text-brand-red hover:underline"
            >
              View all products
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
