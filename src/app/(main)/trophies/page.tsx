import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Award, Users, Star, Layers } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'
import { ComplexQuoteForm } from '@/components/order/ComplexQuoteForm'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/ProductCard'
import type { ProductGroup } from '@/types'

export const metadata: Metadata = {
  title: `Trophies & Awards | ${SITE_NAME}`,
  description:
    'Custom trophies, engraved plaques, medallions, corporate awards and certificate frames. Engraving included. 7–10 day turnaround. Corporate bulk pricing available.',
}

const TRUST_POINTS = [
  { icon: CheckCircle2, label: 'Engraving included on all awards' },
  { icon: Star, label: '7–10 day turnaround' },
  { icon: Users, label: 'Corporate bulk pricing available' },
  { icon: Layers, label: 'Glass, acrylic, metal & timber' },
]

export default async function TrophiesPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('product_groups')
    .select('*')
    .eq('division', 'trophies')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  const productList = (products ?? []) as ProductGroup[]

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Speedy Trophies</span>
            </div>
            <h1 className="font-heading text-4xl font-bold text-white lg:text-5xl">
              Awards that make an impression.
            </h1>
            <p className="mt-4 text-lg text-white/70">
              Trophies, plaques, medallions and corporate awards — engraved to your specification and delivered ready to present. From annual award ceremonies to event podiums, we supply South African businesses and event organisers with recognition products they&apos;re proud to give.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/bulk-orders"
                className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                Request Bulk Quote <ArrowRight className="h-4 w-4" />
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

      {/* Product Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-3xl font-bold text-brand-text">Trophies & Awards products</h2>
            <p className="mt-2 text-brand-text-muted">All awards include custom engraving. Contact us for corporate bulk pricing.</p>
          </div>
          {productList.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {productList.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-brand-bg p-12 text-center">
              <p className="text-brand-text-muted">Products coming soon. <Link href="/contact" className="text-brand-primary underline">Contact us</Link> to enquire.</p>
            </div>
          )}
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote" className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-text">Request a trophies quote</h2>
            <p className="mt-2 text-brand-text-muted">Fill in the form and we&apos;ll get back to you within 1 business day.</p>
          </div>
          <ComplexQuoteForm defaultProductType="Trophies" />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-brand-secondary py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-white">Planning an awards ceremony?</h2>
          <p className="mt-3 text-white/60">We handle bulk trophy orders for events, schools, and corporate programmes.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#quote"
              className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
            >
              Request a Quote <ArrowRight className="h-4 w-4" />
            </a>
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
