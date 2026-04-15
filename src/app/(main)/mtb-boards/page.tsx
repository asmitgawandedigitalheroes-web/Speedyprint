import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, ArrowRight, Upload, Shield, Layers, Mountain } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'
import { CsvUpload } from '@/components/order/CsvUpload'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/ProductCard'
import type { ProductGroup } from '@/types'

export const metadata: Metadata = {
  title: `MTB Boards & Correx Printing | ${SITE_NAME}`,
  description:
    'Mountain bike number boards and correx cycling accessories. CSV variable data upload for events. Weatherproof materials. 5–7 day turnaround.',
}

const TRUST_POINTS = [
  { icon: Upload, label: 'CSV variable data upload' },
  { icon: Shield, label: 'Weatherproof materials' },
  { icon: Layers, label: 'Full-colour both sides' },
  { icon: CheckCircle2, label: '5–7 day turnaround' },
]

export default async function MtbBoardsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('product_groups')
    .select('*')
    .eq('division', 'mtb-boards')
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
                src="/images/speedy-print-logo.png"
                alt="Speedy Print"
                width={220}
                height={80}
                className="h-20 w-auto"
              />
            </div>
            <div className="mb-3 flex items-center gap-2">
              <Mountain className="h-5 w-5 text-brand-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Speedy MTB Boards</span>
            </div>
            <h1 className="font-heading text-4xl font-bold text-white lg:text-5xl">
              MTB boards built for the trail.
            </h1>
            <p className="mt-4 text-lg text-white/70">
              Rigid correx number boards for mountain bike and cycling events — printed in full colour, weatherproof, and built to handle the toughest trails. Upload your rider data via CSV for automated variable-number printing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/order-now?division=mtb-boards"
                className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                Get an Instant Quote <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/bulk-orders"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Bulk Event Pricing
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

      {/* CSV callout */}
      <div className="bg-brand-primary/5 border-b border-brand-primary/10">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <Upload className="h-5 w-5 shrink-0 text-brand-primary" />
            <div>
              <span className="text-sm font-semibold text-brand-text">Organising an MTB event?</span>
              <span className="ml-2 text-sm text-brand-text-muted">Upload rider data (board number, name, category, club) via CSV — we print each board uniquely.</span>
            </div>
            <Link
              href="/bulk-orders"
              className="ml-auto shrink-0 text-sm font-semibold text-brand-primary underline underline-offset-2"
            >
              Learn about bulk event printing →
            </Link>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-3xl font-bold text-brand-text">MTB Board products</h2>
            <p className="mt-2 text-brand-text-muted">All boards support variable data CSV upload for bulk event orders.</p>
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

      {/* CSV Upload Section */}
      <section className="bg-brand-bg py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-text">Upload your rider data</h2>
            <p className="mt-2 text-brand-text-muted">
              Upload your CSV to preview and validate before ordering. The file will be attached to your order for our production team.
            </p>
          </div>
          <div className="rounded-md border border-gray-100 bg-white p-6">
            <CsvUpload productType="mtb-boards" />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-brand-secondary py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-white">Planning a cycling event?</h2>
          <p className="mt-3 text-white/60">We&apos;ll handle the boards so you can focus on the race.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/order-now?division=mtb-boards"
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
