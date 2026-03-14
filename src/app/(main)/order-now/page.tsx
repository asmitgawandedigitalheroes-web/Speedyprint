import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SITE_NAME } from '@/lib/utils/constants'
import { QuickOrderForm } from '@/components/order/QuickOrderForm'

export const metadata: Metadata = {
  title: `Order Now | ${SITE_NAME}`,
  description:
    'Configure and order custom stickers, labels, and decals. Choose your size, material, finish, and quantity. Instant pricing with free delivery on orders over R500.',
}

interface PageProps {
  searchParams: Promise<{
    w?: string
    h?: string
    q?: string
    m?: string
    d?: string
  }>
}

async function OrderFormWrapper({ searchParams }: PageProps) {
  const params = await searchParams
  return (
    <QuickOrderForm
      initialWidth={params.w ? Number(params.w) : undefined}
      initialHeight={params.h ? Number(params.h) : undefined}
      initialQuantity={params.q ? Number(params.q) : undefined}
      initialMaterial={params.m || undefined}
      initialDoming={params.d === '1'}
    />
  )
}

export default async function OrderNowPage(props: PageProps) {
  return (
    <div className="bg-brand-bg py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-brand-text">
            Order Now
          </h1>
          <p className="mt-2 text-brand-text-muted">
            Configure your custom stickers, labels, or decals and get an instant
            price. Free delivery on orders over R500.
          </p>
        </div>

        {/* Form */}
        <Suspense fallback={<div className="py-20 text-center text-brand-text-muted">Loading order form...</div>}>
          <OrderFormWrapper searchParams={props.searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
