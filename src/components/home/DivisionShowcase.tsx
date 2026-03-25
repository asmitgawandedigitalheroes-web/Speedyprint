import Link from 'next/link'
import { Star, Tag, Truck, Layout, Diamond, ArrowRight, type LucideIcon } from 'lucide-react'
import { V2_DIVISIONS } from '@/lib/utils/constants'

const ICON_MAP: Record<string, LucideIcon> = {
  Star,
  Tag,
  Truck,
  Layout,
  Diamond,
}

export function DivisionShowcase() {
  return (
    <section className="bg-brand-bg py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-heading text-3xl font-bold text-brand-text capitalize">
            Our product range
          </h2>
          <p className="mt-2 text-brand-text-muted">
            Premium printing solutions for every need.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {V2_DIVISIONS.map((division) => {
            const Icon = ICON_MAP[division.icon] || Star
            return (
              <Link
                key={division.key}
                href={`/products?division=${division.key}`}
                className="group flex flex-col rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Orange accent bar */}
                <div className="h-1 w-8 rounded-full bg-brand-primary" />

                {/* Icon */}
                <Icon className="mt-4 h-5 w-5 text-brand-primary" />

                {/* Title + description */}
                <h3 className="mt-3 font-heading text-base font-semibold text-brand-text capitalize transition-colors group-hover:text-brand-primary">
                  {division.name}
                </h3>
                <p className="mt-1 flex-1 text-sm text-brand-text-muted">
                  {division.description}
                </p>

                {/* Bottom link */}
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary">
                  Explore <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
