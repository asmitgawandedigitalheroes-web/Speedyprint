import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SITE_NAME, WHATSAPP_URL } from '@/lib/utils/constants'
import { ComplexQuoteForm } from '@/components/order/ComplexQuoteForm'
import { Loader2, Phone, MessageCircle, Mail, Info, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Request a Quote — Custom Printing',
  description:
    'Get a custom quote for race numbers, MTB boards, laser engraving, stamps, and more. Fast 24-hour turnaround on all enquiries.',
}

const DIVISION_TO_PRODUCT_TYPE: Record<string, string> = {
  'race-numbers': 'Race Numbers',
  'mtb-boards': 'MTB Boards',
  'stamps': 'Stamps',
  'laser': 'Laser Engraving',
  'trophies': 'Trophies',
  'print': 'Print',
}

interface PageProps {
  searchParams: Promise<{
    division?: string
  }>
}

async function QuoteFormWrapper({ searchParams }: PageProps) {
  const params = await searchParams
  const productType = params.division ? DIVISION_TO_PRODUCT_TYPE[params.division] : undefined

  return (
    <div className="space-y-8">
      <ComplexQuoteForm defaultProductType={productType} />
    </div>
  )
}

export default async function RequestQuotePage(props: PageProps) {
  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link 
            href="/products" 
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-text-muted hover:text-brand-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Products
          </Link>
          <div className="h-1 w-8 bg-brand-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-brand-text">Request a Custom Quote</h1>
          <p className="mt-2 text-brand-text-muted">
            Fill in the details below and our team will get back to you with a formal quote within 1 business day.
          </p>
          
          {/* Support bar */}
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-gray-100 bg-brand-bg px-4 py-3 text-sm">
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

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
            </div>
          }>
            <QuoteFormWrapper searchParams={props.searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
