import Link from 'next/link'
import { Star, Tag, Truck, Layout, Diamond, type LucideIcon } from 'lucide-react'
import { V2_DIVISIONS } from '@/lib/utils/constants'

const ICON_MAP: Record<string, LucideIcon> = {
  Star,
  Tag,
  Truck,
  Layout,
  Diamond,
}

const DIVISION_COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  '#FF6B00': { bg: 'bg-brand-primary/10', text: 'text-brand-primary' },
  '#1E3A5F': { bg: 'bg-brand-secondary/10', text: 'text-brand-secondary' },
  '#00C853': { bg: 'bg-green-100', text: 'text-green-600' },
  '#8B5CF6': { bg: 'bg-purple-100', text: 'text-purple-600' },
  '#EC4899': { bg: 'bg-pink-100', text: 'text-pink-600' },
}

export function DivisionShowcase() {
  return (
    <section className="bg-brand-bg py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-brand-text">
            Our Products
          </h2>
          <p className="mt-2 text-brand-text-muted">
            Premium printing solutions for every need.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {V2_DIVISIONS.map((division) => {
            const Icon = ICON_MAP[division.icon] || Star
            const colors = DIVISION_COLOR_CLASSES[division.color] || { bg: 'bg-gray-100', text: 'text-gray-600' }
            return (
              <Link
                key={division.key}
                href={`/products?division=${division.key}`}
                className="group rounded-xl bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.bg}`}
                >
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <h3 className="mt-4 font-heading text-base font-semibold text-brand-text group-hover:text-brand-primary">
                  {division.name}
                </h3>
                <p className="mt-1 text-sm text-brand-text-muted">
                  {division.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
