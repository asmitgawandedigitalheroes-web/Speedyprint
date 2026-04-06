'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ProductConfigurator } from './ProductConfigurator'
import { SITE_NAME } from '@/lib/utils/constants'
import type {
  ProductGroup,
  ProductTemplate,
  TemplateParameter,
  PricingRule,
  Division,
} from '@/types'

type TemplateWithParams = ProductTemplate & {
  template_parameters: TemplateParameter[]
}

interface ProductDetailClientProps {
  product: ProductGroup
  templates: TemplateWithParams[]
  pricingRules: PricingRule[]
  divisionName: string | null
  division: Division
}

export function ProductDetailClient({
  product,
  templates,
  pricingRules,
  divisionName,
  division,
}: ProductDetailClientProps) {
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(
    templates[0]?.image_url || product.image_url
  )

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    setActiveImageUrl(template?.image_url || product.image_url)
  }

  // Collect all unique images for thumbnail gallery
  const allImages: { url: string; label: string }[] = []
  if (product.image_url) {
    allImages.push({ url: product.image_url, label: product.name })
  }
  for (const t of templates) {
    if (t.image_url && !allImages.some((img) => img.url === t.image_url)) {
      allImages.push({ url: t.image_url, label: t.name })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      {/* Left: Product image */}
      <div>
        <div
          className="relative flex h-80 items-center justify-center overflow-hidden rounded-xl bg-brand-bg lg:h-[480px]"
        >
          {activeImageUrl ? (
            <div className="absolute inset-x-0 top-0 bottom-[-15%]">
              <Image
                src={activeImageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
                priority
              />
            </div>
          ) : (
            <span className="text-8xl font-bold text-white/20 select-none">
              {product.name.charAt(0)}
            </span>
          )}

          {/* Branding Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-brand-secondary/90 px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                {/* BUG-013/014 FIX: Was hardcoded "SPEEDY LABELS" causing SSR/client
                    hydration mismatch when the brand was renamed to Speedy Print Suite. */}
                <p className="text-xs font-bold uppercase tracking-wider text-white">
                  {SITE_NAME}
                </p>
                {divisionName && (
                  <p className="text-[10px] text-white/70">{divisionName}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        {allImages.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {allImages.map((img) => (
              <button
                key={img.url}
                onClick={() => setActiveImageUrl(img.url)}
                className={cn(
                  'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                  activeImageUrl === img.url
                    ? 'border-brand-primary ring-2 ring-brand-primary/30'
                    : 'border-gray-200 hover:border-gray-400'
                )}
              >
                <Image
                  src={img.url}
                  alt={img.label}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Configurator */}
      <div>
        <ProductConfigurator
          productGroupId={product.id}
          division={division}
          templates={templates}
          pricingRules={pricingRules}
          onTemplateChange={handleTemplateChange}
        />
      </div>
    </div>
  )
}
