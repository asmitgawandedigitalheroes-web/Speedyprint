import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DIVISIONS } from '@/lib/utils/constants'
import type { ProductGroup } from '@/types'

// Removed divisionGradients for clean, flat UI

interface ProductCardProps {
  product: ProductGroup
}

export function ProductCard({ product }: ProductCardProps) {
  const division = DIVISIONS.find((d) => d.key === product.division)

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-gray-200 bg-white transition-all duration-400 hover:border-gray-300 hover:shadow-2xl hover:shadow-black/5">
        
        {/* Product image */}
        <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gray-50/50">
          {product.image_url ? (
            <div className="absolute inset-x-0 top-0 bottom-[-15%]">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                priority={false}
              />
            </div>
          ) : (
            <span className="text-5xl font-bold text-gray-300 select-none">
              {product.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Content Container */}
        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h3 className="font-heading text-2xl font-black leading-[1.15] tracking-tight text-brand-secondary transition-colors group-hover:text-brand-primary">
              {product.name}
            </h3>
            {division && (
              <div className="mt-1 inline-flex shrink-0 items-center justify-center rounded-xl bg-teal-50 px-3.5 py-1.5 backdrop-blur-sm">
                <span className="text-[11px] font-bold uppercase tracking-widest text-teal-600">
                  {division.name}
                </span>
              </div>
            )}
          </div>
          {product.description && (
            <p className="mt-auto text-base leading-relaxed text-slate-500 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
