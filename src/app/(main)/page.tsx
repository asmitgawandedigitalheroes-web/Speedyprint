import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants'
import { TestimonialsCarousel } from '@/components/home/TestimonialsCarousel'
import { FeatureStrip } from '@/components/home/FeatureStrip'
import { HowItWorks } from '@/components/home/HowItWorks'
import { ProofRow } from '@/components/home/ProofRow'
import { ProductFamilies } from '@/components/home/ProductFamilies'
import { DesignerDemo } from '@/components/home/DesignerDemo'
import { HomeFAQ } from '@/components/home/HomeFAQ'
import { SegmentedCTA } from '@/components/home/SegmentedCTA'
import {
  ArrowRight,
  Star,
  Zap,
  Shield,
  Leaf,
  CheckCircle2,
} from 'lucide-react'

export const metadata: Metadata = {
  title: `${SITE_NAME} | Custom Stickers, Labels & Decals in South Africa`,
  description:
    'Premium custom stickers, product labels, vehicle decals, and 3D domed stickers. Get an instant quote, design online, and order. Fast delivery across South Africa.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} | Custom Stickers & Labels Made Simple`,
    description:
      "South Africa's online custom sticker and label printing platform. Instant pricing, online designer, fast delivery.",
    url: SITE_URL,
  },
}

const WHY_US = [
  {
    icon: Zap,
    title: '24-Hour Turnaround',
    desc: 'From order to printed and ready to ship — faster than anyone else in South Africa.',
    color: 'bg-brand-primary/10',
    iconColor: 'text-brand-primary',
  },
  {
    icon: Shield,
    title: 'Premium Quality',
    desc: '300gsm stock, UV-cured inks, and quality checks on every single order we produce.',
    color: 'bg-brand-primary/10',
    iconColor: 'text-brand-primary',
  },
  {
    icon: Leaf,
    title: 'Eco-Certified Inks',
    desc: '100% eco-certified water-based inks. Great for your brand, great for the planet.',
    color: 'bg-brand-primary/10',
    iconColor: 'text-brand-primary',
  },
]

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── 1. HERO ──────────────────────────────────────────────────── */}
      <section className="relative bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">

            {/* Left: text content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 backdrop-blur-md">
                <div className="h-1 w-1 animate-pulse rounded-full bg-yellow-400" />
                <span className="text-[10px] font-bold tracking-widest text-yellow-400">
                  SOUTH AFRICA'S TRUSTED LABEL & STICKER PARTNER
                </span>
              </div>

              <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-tight text-brand-text sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
                Labels &amp; Stickers<br />
                that make brands{' '}
                <span className="relative whitespace-nowrap text-brand-primary">
                  unforgettable.
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    height="5"
                    viewBox="0 0 300 5"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M0 2.5 Q75 0.5 150 2.5 Q225 4.5 300 2.5"
                      stroke="#E30613"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.5"
                    />
                  </svg>
                </span>
              </h1>

              <p className="mx-auto max-w-[460px] text-lg leading-relaxed text-brand-text-muted lg:mx-0">
                Precision printing for small businesses and makers — real-time
                pricing, an online designer, and 24-hour turnaround delivery.
              </p>

              <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link
                  href="/order-now"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-primary-dark hover:shadow-brand-primary/40"
                >
                  Get Instant Quote
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/templates"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-brand-text shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-primary/30 hover:text-brand-primary"
                >
                  Try Designer Tool
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-5 border-t border-gray-100 pt-6 lg:justify-start">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-brand-accent text-brand-accent" strokeWidth={1.5} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-brand-text">4.9/5</span>
                  <span className="text-sm text-brand-text-muted">· 2,000+ reviews</span>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-brand-text-muted">Free delivery over R500</span>
                </div>
              </div>
            </div>

            {/* Right: hero image */}
            <div className="relative">
              <div className="absolute -left-4 top-8 z-10 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/5 lg:-left-8">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                  <Zap className="h-4 w-4 text-brand-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-text">24hr Turnaround</p>
                  <p className="text-[10px] text-brand-text-muted">Same day dispatch</p>
                </div>
              </div>

              <div className="absolute -right-4 bottom-14 z-10 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/5 lg:-right-8">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-text">5,000+ Clients</p>
                  <p className="text-[10px] text-brand-text-muted">Trusted nationwide</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-bg via-gray-100 to-gray-200 p-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image
                    src="/images/products/custom-labels.png"
                    alt="Custom labels and stickers showcase"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/50 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-center gap-3 rounded-xl bg-white/90 px-4 py-2.5 shadow-lg backdrop-blur-sm">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary">
                        <span className="text-[10px] font-bold text-white">SL</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-brand-text">300gsm Matte Finish</p>
                        <p className="text-[10px] text-brand-text-muted">Industrial Specification</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. PRODUCT FAMILIES ──────────────────────────────────────── */}
      <ProductFamilies />

      {/* ── 3. HOW ORDERING WORKS ────────────────────────────────────── */}
      <section id="how-it-works">
        <HowItWorks />
      </section>

      {/* ── 4. WHY BUSINESSES CHOOSE SPEEDY ──────────────────────────── */}
      <section className="bg-brand-secondary py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-yellow-400">
              Why Speedy Labels
            </p>
            <h2 className="font-heading text-3xl font-bold capitalize text-white lg:text-4xl">
              Built for brands that move fast
            </h2>
            <p className="mt-3 text-white/50">
              Everything you need to print with confidence, every time.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {WHY_US.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-white/8 bg-white/5 p-6 transition-all duration-300 hover:bg-white/10 hover:border-white/15 sm:p-8"
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`}>
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <h3 className="font-heading text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/55">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. BULK / VARIABLE-DATA CAPABILITY ───────────────────────── */}
      <section id="bulk-orders" className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-yellow-400">
                High Volume Print Management
              </p>
              <h2 className="font-heading text-3xl font-bold capitalize text-brand-text lg:text-4xl">
                Dynamic Batch Generation
              </h2>
              <p className="mt-4 text-brand-text-muted leading-relaxed">
                Stop manually designing individual files. Upload a CSV spreadsheet and our engine will instantly generate hundreds of unique, production-ready labels, MTB boards, or race numbers from a single design template.
              </p>

              <ul className="mt-8 space-y-4 inline-block text-left">
                {[
                  'Map spreadsheet columns directly to text layers',
                  'Auto-generate consolidated multi-page PDF proofs',
                  'Checkout entire batches as a single cart item',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-brand-text-muted">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Link
                  href="/templates"
                  className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark"
                >
                  Explore Templates →
                </Link>
              </div>
            </div>

            <div className="relative aspect-square w-full rounded-3xl bg-brand-bg p-8 flex flex-col items-center justify-center lg:aspect-auto lg:h-[500px]">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:1rem_1rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />

              <div className="relative z-10 flex w-full max-w-sm flex-col gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-4 w-4 text-green-600">
                      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-brand-text">participants.csv</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 flex-1 rounded bg-gray-100" />
                    <div className="h-6 flex-1 rounded bg-gray-100" />
                    <div className="h-6 flex-1 rounded bg-gray-100" />
                  </div>
                </div>

                <div className="flex justify-center text-brand-primary">
                  <svg className="h-6 w-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                <div className="relative h-32 w-full">
                  <div className="absolute left-4 right-4 top-0 h-24 rounded-xl border border-gray-200 bg-white shadow-sm" style={{ transform: 'translateY(16px) scale(0.95)' }} />
                  <div className="absolute left-2 right-2 top-0 h-24 rounded-xl border border-gray-200 bg-white shadow-sm" style={{ transform: 'translateY(8px) scale(0.98)' }} />
                  <div className="absolute left-0 right-0 top-0 flex h-24 items-center justify-center rounded-xl border border-brand-primary/20 bg-white shadow-md">
                    <span className="font-heading text-lg font-bold text-brand-text">150× Print Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. ONLINE DESIGNER TOOL ──────────────────────────────────── */}
      <DesignerDemo />

      {/* ── 7. TESTIMONIALS ──────────────────────────────────────────── */}
      <TestimonialsCarousel />

      {/* ── 8. INLINE FAQ ────────────────────────────────────────────── */}
      <HomeFAQ />

      {/* ── 9. SEGMENTED CTA ────────────────────────────────────────── */}
      <SegmentedCTA />

      {/* Proof row moved to footer area or kept as trust bar */}
      <ProofRow />
    </div>
  )
}
