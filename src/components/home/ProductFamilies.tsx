import Link from 'next/link'
import { Tag, Hash, Stamp, Zap, Layout, ArrowRight } from 'lucide-react'
import { PRODUCT_FAMILIES } from '@/lib/utils/constants'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Tag,
  Hash,
  Stamp,
  Zap,
  Layout,
}

export function ProductFamilies() {
  return (
    <section className="bg-brand-bg py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-primary">
              Our products
            </p>
            <h2 className="font-heading text-3xl font-bold text-brand-text lg:text-4xl">
              Find your product family
            </h2>
            <p className="mt-3 max-w-xl text-brand-text-muted">
              From everyday labels to precision laser fabrication — browse by category to find exactly what you need.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-primary hover:text-brand-primary-dark transition-colors"
          >
            View full catalogue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Family cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_FAMILIES.map((family) => {
            const Icon = ICON_MAP[family.icon] ?? Tag
            return (
              <Link
                key={family.key}
                href={`/products?division=${family.divisionKey}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-md"
              >
                {/* Image Preview */}
                <div className="relative h-40 w-full overflow-hidden bg-brand-bg">
                  <img
                    src={family.imageUrl}
                    alt={family.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60" />
                  
                  {/* Floating Icon */}
                  <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-sm transition-colors group-hover:bg-brand-primary/10">
                    <Icon className="h-5 w-5 text-brand-primary" />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  {/* Name + description */}
                  <h3 className="font-heading text-lg font-bold text-brand-text group-hover:text-brand-primary transition-colors">
                    {family.name}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-brand-text-muted">
                    {family.description}
                  </p>

                  {/* Product badges */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {family.products.map((product) => (
                      <span
                        key={product}
                        className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-brand-text-muted"
                      >
                        {product}
                      </span>
                    ))}
                  </div>

                  {/* Explore link */}
                  <div className="mt-auto pt-5 flex items-center gap-1 text-sm font-semibold text-brand-primary">
                    Get Quote / Customize
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
