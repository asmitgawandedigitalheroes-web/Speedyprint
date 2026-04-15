import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, ArrowRight, Zap, RefreshCw, Layers, Stamp } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/ProductCard'
import type { ProductGroup } from '@/types'

export const metadata: Metadata = {
  title: `Custom Stamps | ${SITE_NAME}`,
  description:
    'Self-inking and traditional rubber stamps. Custom business stamps, address stamps, signature stamps — 2–3 day turnaround. Replacement ink available.',
}

const TRUST_POINTS = [
  { icon: CheckCircle2, label: 'Self-inking & traditional options' },
  { icon: Zap, label: '2–3 day turnaround' },
  { icon: RefreshCw, label: 'Replacement ink available' },
  { icon: Layers, label: 'Multiple sizes & ink colours' },
]

export default async function StampsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('product_groups')
    .select('*')
    .eq('division', 'stamps')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  const productList = (products ?? []) as ProductGroup[]

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-6">
              <Image
                src="/images/speedy-stamps-logo.png"
                alt="Speedy Stamps"
                width={220}
                height={80}
                className="h-20 w-auto"
              />
            </div>
            <div className="mb-3 flex items-center gap-2">
              <Stamp className="h-5 w-5 text-brand-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Speedy Stamps</span>
            </div>
            <h1 className="font-heading text-4xl font-bold text-white lg:text-5xl">
              Custom stamps, delivered in days.
            </h1>
            <p className="mt-4 text-lg text-white/70">
              Business stamps, address stamps, logo stamps — designed and produced in-house with fast 2–3 day turnaround. Choose from self-inking, pre-inked, or traditional rubber stamp mounts, with replacement ink pads available.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/order-now?division=stamps"
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

      {/* Product Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-3xl font-bold text-brand-text">Stamp products</h2>
            <p className="mt-2 text-brand-text-muted">Customise online or upload your own artwork.</p>
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

      {/* Bottom CTA */}
      <section className="bg-brand-secondary py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-white">Need a custom stamp?</h2>
          <p className="mt-3 text-white/60">Upload your logo or let us design it for you — ready in 2–3 days.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/order-now?division=stamps"
              className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
            >
              Get an Instant Quote <ArrowRight className="h-4 w-4" />
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
