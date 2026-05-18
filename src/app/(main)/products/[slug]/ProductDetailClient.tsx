'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ProductConfigurator } from './ProductConfigurator'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
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
  designId?: string
}


export function ProductDetailClient({
  product,
  templates,
  pricingRules,
  divisionName,
  division,
  designId,
}: ProductDetailClientProps) {
  // Collect all unique images
  const allImages: { url: string; label: string }[] = []
  if (product.image_url) {
    allImages.push({ url: product.image_url, label: product.name })
  }
  for (const t of templates) {
    if (t.image_url && !allImages.some((img) => img.url === t.image_url)) {
      allImages.push({ url: t.image_url, label: t.name })
    }
  }

  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = allImages[activeIndex] ?? null

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template?.image_url) {
      const idx = allImages.findIndex((img) => img.url === template.image_url)
      if (idx !== -1) setActiveIndex(idx)
    }
  }

  const prev = () => setActiveIndex((i) => (i - 1 + allImages.length) % allImages.length)
  const next = () => setActiveIndex((i) => (i + 1) % allImages.length)

  return (
    <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px]">

      {/* ── LEFT: Image panel ─────────────────────────────────────────── */}
      <div>

        {/* Main image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-200">
          {activeImage ? (
            <Image
              src={activeImage.url}
              alt={activeImage.label}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center"
              priority
            />
          ) : (
            // TODO: Replace with real product photography before launch
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-50 to-gray-100">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect width="64" height="64" rx="12" fill="var(--color-brand-primary)" fillOpacity="0.08"/>
                <path d="M20 44V20h24v24H20zm4-4h16V24H24v16zm4-8h8v-4h-8v4z" fill="var(--color-brand-primary)" fillOpacity="0.4"/>
              </svg>
              <span className="text-xs font-medium text-gray-400 select-none">{product.name}</span>
            </div>
          )}

          {/* Division badge */}
          {divisionName && (
            <div className="absolute left-4 top-4 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
              {divisionName}
            </div>
          )}

          {/* Navigation arrows (only if multiple images) */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm ring-1 ring-gray-200 hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm ring-1 ring-gray-200 hover:bg-white transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === activeIndex ? 'w-5 bg-brand-primary' : 'w-1.5 bg-white/70'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {allImages.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {allImages.map((img, i) => (
              <button
                key={img.url}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                  i === activeIndex
                    ? 'border-brand-primary ring-2 ring-brand-primary/20'
                    : 'border-gray-200 hover:border-gray-400'
                )}
              >
                <Image src={img.url} alt={img.label} fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

      </div>

      {/* ── RIGHT: Configurator panel ─────────────────────────────────── */}
      <div className="lg:border-l lg:border-gray-100 lg:pl-10 xl:pl-14">
        <Suspense fallback={
          <div className="flex items-center justify-center py-16 text-brand-text-muted">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm">Loading options…</span>
          </div>
        }>
          <ProductConfigurator
            productGroupId={product.id}
            division={division}
            templates={templates}
            pricingRules={pricingRules}
            onTemplateChange={handleTemplateChange}
            designId={designId}
          />
        </Suspense>
      </div>

    </div>
  )
}
