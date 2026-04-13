import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SITE_NAME, DIVISIONS } from '@/lib/utils/constants'
import { QuickOrderForm } from '@/components/order/QuickOrderForm'
import { ComplexQuoteForm } from '@/components/order/ComplexQuoteForm'
import { Loader2, Tag, Hash, Bike, Zap, Trophy, Printer } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

const COMPLEX_DIVISIONS = ['trophies', 'laser']

export const metadata: Metadata = {
  title: `Order now | ${SITE_NAME}`,
  description:
    'Configure and order custom stickers, labels, and decals. Choose your size, material, finish, and quantity. Instant pricing with free delivery on orders over R500.',
}

const ICON_MAP: Record<string, any> = {
  Tag,
  Hash,
  Bike,
  Zap,
  Trophy,
  Printer,
}

interface PageProps {
  searchParams: Promise<{ 
    division?: string
    w?: string 
    h?: string 
    q?: string 
    m?: string 
    d?: string 
  }>
}

async function OrderFormWrapper({ searchParams }: PageProps) {
  const params = await searchParams
  const activeDivision = params.division || 'labels'

  return (
    <div className="space-y-8">
      {/* Product Division Selector */}
      <Tabs defaultValue={activeDivision} className="w-full mb-6">
        <TabsList className="!h-auto flex w-full flex-wrap gap-1 bg-gray-100/50 p-1 shadow-inner ring-1 ring-black/5">
          {DIVISIONS.map((div) => {
            const Icon = ICON_MAP[div.icon] || Tag
            return (
              <TabsTrigger
                key={div.key}
                value={div.key}
                asChild
                className="!h-auto flex-1 basis-[calc(50%-4px)] py-4 transition-all data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-md sm:basis-0 sm:py-3 lg:data-[state=active]:ring-1 lg:data-[state=active]:ring-brand-primary/10"
              >
                <Link
                  href={`/order-now?division=${div.key}${params.w ? `&w=${params.w}` : ''}${params.h ? `&h=${params.h}` : ''}`}
                  className="flex flex-col items-center gap-1.5"
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider sm:text-xs">
                    {div.name}
                  </span>
                </Link>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {COMPLEX_DIVISIONS.includes(activeDivision) ? (
        <ComplexQuoteForm defaultProductType={
          activeDivision === 'trophies' ? 'Trophies' : 'Laser Engraving'
        } />
      ) : (
        <QuickOrderForm
          division={activeDivision}
          initialWidth={params.w ? Number(params.w) : undefined}
          initialHeight={params.h ? Number(params.h) : undefined}
          initialQuantity={params.q ? Number(params.q) : undefined}
          initialMaterial={params.m || undefined}
          initialDoming={params.d === '1'}
        />
      )}
    </div>
  )
}

export default async function OrderNowPage(props: PageProps) {
  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-brand-text">Instant Quote</h1>
          <p className="mt-2 text-brand-text-muted">
            Configure your product specifications — get an instant price. Free delivery on orders over R500.
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
