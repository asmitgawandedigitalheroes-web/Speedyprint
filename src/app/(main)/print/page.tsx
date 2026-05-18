import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, ArrowRight, Zap, Clock, Layers, Printer } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'
import { ComplexQuoteForm } from '@/components/order/ComplexQuoteForm'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProductCard } from '@/components/products/ProductCard'
import type { ProductGroup } from '@/types'

export const revalidate = 3600

const getPrintProducts = unstable_cache(
  async () => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('product_groups')
      .select('*')
      .eq('division', 'print')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    return (data ?? []) as ProductGroup[]
  },
  ['division-products-print'],
  { revalidate: 3600, tags: ['products'] }
)

export const metadata: Metadata = {
  title: 'Print & Stationery',
  description:
    'Business cards, flyers, posters, calendars, brochures, certificates, notepads, envelopes and coffee sleeves. Fast turnaround, premium quality print from Speedy Print.',
}

const TRUST_POINTS = [
  { icon: CheckCircle2, label: 'Premium quality paper & finishes' },
  { icon: Clock, label: '3–5 day turnaround' },
  { icon: Zap, label: 'Gloss, matt & spot UV options' },
  { icon: Layers, label: 'Single & double sided' },
]

const PRINT_PRODUCTS = [
  { name: 'Business Cards', description: '50×90mm · 300gsm · Single or double sided · Gloss or matt lamination', href: '/request-quote?division=print' },
  { name: 'Flyers', description: 'A6, A5, A4, DL · Full colour · Gloss or uncoated stock', href: '/request-quote?division=print' },
  { name: 'Poster Calendars', description: 'A2, A1 · Year-at-a-glance · Ideal for corporate gifting', href: '/request-quote?division=print' },
  { name: 'Brochures & Catalogues', description: 'A5, A4 · Folded or staple-bound · Full colour', href: '/request-quote?division=print' },
  { name: 'Certificates', description: 'A4 · Premium card stock · Ideal for awards and events', href: '/request-quote?division=print' },
  { name: 'Note Pads', description: 'A5, A6 · 50 or 100 sheets · Custom cover & branding', href: '/request-quote?division=print' },
  { name: 'Envelopes', description: 'DL, C5, C4 · Branded with your logo & return address', href: '/request-quote?division=print' },
  { name: 'Coffee Cup Sleeves', description: '70×270mm · 250gsm or Kraft · Colour or black print', href: '/request-quote?division=print' },
  { name: 'Event Printing', description: 'Programmes, menus, table cards, invitations & more', href: '/request-quote?division=print' },
]

export default async function PrintPage() {
  const productList = await getPrintProducts()

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-6">
              <Image
                src="/images/speedy-print-logo.png"
                alt="Speedy Print"
                width={220}
                height={80}
                className="h-20 w-auto"
              />
            </div>
            <div className="mb-3 flex items-center gap-2">
              <Printer className="h-5 w-5 text-brand-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Speedy Print</span>
            </div>
            <h1 className="font-heading text-4xl font-bold text-white lg:text-5xl">
              Print that represents your brand.
            </h1>
            <p className="mt-4 text-lg text-white/70">
              Business cards, flyers, posters, calendars, brochures, certificates and more — all printed in-house with fast turnaround and premium finishes. Whether you need 50 business cards or 5 000 flyers, we&apos;ve got you covered.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/request-quote?division=print"
                className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                Get an Instant Quote <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Strip */}
      <div className="border-b border-gray-100 bg-brand-bg">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {TRUST_POINTS.map((point) => (
              <div key={point.label} className="flex items-center gap-2">
                <point.icon className="h-4 w-4 shrink-0 text-brand-primary" />
                <span className="text-xs font-medium text-brand-text">{point.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product List */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-3xl font-bold text-brand-text">Print products</h2>
            <p className="mt-2 text-brand-text-muted">Browse our full range of commercial print products.</p>
          </div>

          {/* DB-driven product cards (shown when products exist in Supabase) */}
          {productList.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {productList.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            /* Static product grid (shown while print products are being added to DB) */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PRINT_PRODUCTS.map((product) => (
                <Link
                  key={product.name}
                  href={product.href}
                  className="group flex flex-col rounded-xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-brand-primary/20 hover:shadow-lg"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
                    <Printer className="h-5 w-5 text-brand-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-brand-text">{product.name}</h3>
                  <p className="mt-1 flex-1 text-sm text-brand-text-muted">{product.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-primary">
                    Get a quote <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote" className="bg-brand-bg py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-text">Request a print quote</h2>
            <p className="mt-2 text-brand-text-muted">Tell us what you need and we&apos;ll get back to you within 1 business day.</p>
          </div>
          <ComplexQuoteForm />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-brand-secondary py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-white">Need a bulk print run?</h2>
          <p className="mt-3 text-white/60">We handle large corporate and event print orders with priority scheduling.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/request-quote?division=print"
              className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
            >
              Get a Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 px-7 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
