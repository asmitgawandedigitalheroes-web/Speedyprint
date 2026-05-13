import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { SITE_NAME, WHATSAPP_URL } from '@/lib/utils/constants'
import { QuickOrderForm } from '@/components/order/QuickOrderForm'
import { Loader2, Phone, MessageCircle, Mail, Info } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Instant Quote — Custom Labels',
  description:
    'Configure and order custom labels and stickers. Choose your size, material, finish, and quantity. Instant pricing with free delivery on orders over R500.',
}

const DIVISION_REDIRECTS: Record<string, string> = {
  'race-numbers': '/race-numbers',
  'mtb-boards': '/mtb',
  'stamps': '/stamps',
  'laser': '/laser',
  'trophies': '/trophies',
}

interface PageProps {
  searchParams: Promise<{
    w?: string
    h?: string
    q?: string
    m?: string
    d?: string
    division?: string
  }>
}

async function OrderFormWrapper({ searchParams }: PageProps) {
  const params = await searchParams
  return (
    <div className="space-y-8">
      <QuickOrderForm
        division="labels"
        initialWidth={params.w ? Number(params.w) : undefined}
        initialHeight={params.h ? Number(params.h) : undefined}
        initialQuantity={params.q ? Number(params.q) : undefined}
        initialMaterial={params.m || undefined}
        initialDoming={params.d === '1'}
      />
    </div>
  )
}

export default async function OrderNowPage(props: PageProps) {
  const params = await props.searchParams
  if (params.division && DIVISION_REDIRECTS[params.division]) {
    redirect(DIVISION_REDIRECTS[params.division])
  }

  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-brand-text">Get an Instant Quote — Custom Labels</h1>
          <p className="mt-2 text-brand-text-muted">
            Configure your label specifications below and get an instant price. Free delivery on orders over R500.
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Need a quote for Race Numbers, Stamps, or other products?{' '}
              <Link href="/products" className="font-semibold underline hover:no-underline">
                Visit each product page
              </Link>{' '}
              for a live configurator.
            </span>
          </div>
          {/* Support bar */}
          <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 bg-brand-bg px-4 py-3 text-sm">
            <span className="font-semibold text-brand-text">Need help?</span>
            <a href="tel:0110271811" className="flex items-center gap-1.5 text-brand-text-muted hover:text-brand-primary transition-colors">
              <Phone className="h-3.5 w-3.5" /> 011 027 1811
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#25D366] hover:underline transition-colors">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp us
            </a>
            <a href="mailto:info@speedyprint.co.za" className="flex items-center gap-1.5 text-brand-text-muted hover:text-brand-primary transition-colors">
              <Mail className="h-3.5 w-3.5" /> info@speedyprint.co.za
            </a>
          </div>
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
