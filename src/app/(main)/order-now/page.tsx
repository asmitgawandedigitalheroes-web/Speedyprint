import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SITE_NAME } from '@/lib/utils/constants'
import { QuickOrderForm } from '@/components/order/QuickOrderForm'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: `Order now | ${SITE_NAME}`,
  description:
    'Configure and order custom stickers, labels, and decals. Choose your size, material, finish, and quantity. Instant pricing with free delivery on orders over R500.',
}

interface PageProps {
  searchParams: Promise<{ w?: string; h?: string; q?: string; m?: string; d?: string }>
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
    <div className="bg-brand-bg min-h-screen">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-brand-text">Configure your order</h1>
          <p className="mt-2 text-brand-text-muted">
            Set your dimensions, material, and quantity — get an instant price. Free delivery on orders over R500.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
          </div>
        }>
          <OrderFormWrapper searchParams={props.searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
