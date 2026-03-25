import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DIVISIONS } from '@/lib/utils/constants'
import type { ProductGroup } from '@/types'

const divisionGradients: Record<string, string> = {
  labels: 'from-red-500 to-orange-400',
  laser: 'from-blue-600 to-cyan-400',
  events: 'from-green-500 to-emerald-400',
  stamps: 'from-purple-600 to-pink-400',
  sleeves: 'from-amber-500 to-yellow-400',
}

interface ProductCardProps {
  product: ProductGroup
}

export function ProductCard({ product }: ProductCardProps) {
  const division = DIVISIONS.find((d) => d.key === product.division)
  const gradient = divisionGradients[product.division] ?? 'from-gray-500 to-gray-400'

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        {/* Product image */}
        <div
          className={`relative h-48 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-5xl font-bold text-white/30 select-none">
              {product.name.charAt(0)}
            </span>
          )}
        </div>

        <CardContent className="pt-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-brand-text group-hover:text-brand-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
            {division && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {division.name}
              </Badge>
            )}
          </div>
          {product.description && (
            <p className="text-sm text-brand-text-muted line-clamp-2">
              {product.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
