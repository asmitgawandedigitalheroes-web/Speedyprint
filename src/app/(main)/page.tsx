import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants'
import { TestimonialsCarousel } from '@/components/home/TestimonialsCarousel'
import { HowItWorks } from '@/components/home/HowItWorks'
import { ProofRow } from '@/components/home/ProofRow'
import { ProductHub } from '@/components/home/ProductHub'
import { DesignerDemo } from '@/components/home/DesignerDemo'
import { HomeFAQ } from '@/components/home/HomeFAQ'
import { FeaturedWork } from '@/components/home/FeaturedWork'
import { CTABand } from '@/components/home/CTABand'
import {
  ArrowRight,
  Star,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Palette,
  Layout,
} from 'lucide-react'

export const metadata: Metadata = {
  title: `${SITE_NAME} | Fast Custom Print Solutions for South Africa`,
  description:
    'Order labels, race numbers, MTB boards, stamps, trophies, and laser-cut products. Fast turnaround, premium quality, and nationwide delivery.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} | Custom Print Solutions Made Simple`,
    description:
      "South Africa's complete online custom print platform. Fast turnaround, online designer, and specialized expertise across all categories.",
    url: SITE_URL,
  },
}

const WHY_US = [
  {
    icon: Clock,
    title: 'Fast Turnaround',
    desc: 'From order to ready-to-ship — we prioritize speed across all our print categories.',
    color: 'bg-brand-primary/10',
    iconColor: 'text-brand-primary',
  },
  {
    icon: Layout,
    title: 'Simple Ordering',
    desc: 'Our platform is designed for ease. Configure, design, and order in minutes.',
    color: 'bg-brand-primary/10',
    iconColor: 'text-brand-primary',
  },
  {
    icon: Palette,
    title: 'Artwork Help',
    desc: 'Need design tweaks or expert advice? Our team is here to ensure your prints look perfect.',
    color: 'bg-brand-primary/10',
    iconColor: 'text-brand-primary',
  },
  {
    icon: ShieldCheck,
    title: 'Reliable Quality',
    desc: 'Premium materials and rigorous quality checks on every product we manufacture.',
    color: 'bg-brand-primary/10',
    iconColor: 'text-brand-primary',
  },
]

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── 1. HERO ──────────────────────────────────────────────────── */}
      <section className="relative bg-white overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-primary/5 blur-3xl" />
        <div className="absolute -left-24 top-1/2 h-72 w-72 rounded-full bg-brand-secondary/5 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">

            {/* Left: text content */}
            <div className="relative z-10 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3 py-1.5 backdrop-blur-md">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-primary" />
                <span className="text-[10px] font-bold tracking-widest text-brand-primary uppercase">
                  South Africa's Premium Print Suite
                </span>
              </div>

              <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-tight text-brand-text sm:text-5xl lg:text-6xl xl:text-[4.5rem]">
                Fast custom print<br />
                solutions for{' '}
                <span className="relative inline-block text-brand-primary italic">
                  business,
                </span>{' '}
                events and brands
              </h1>

              <p className="mx-auto max-w-[540px] text-lg leading-relaxed text-brand-text-muted lg:mx-0">
                Order labels, race numbers, MTB boards, stamps, trophies and laser-cut products — all from one trusted Speedy platform.
              </p>

              <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-2 rounded-xl bg-brand-primary px-8 py-4 text-sm font-bold text-white shadow-lg shadow-brand-primary/25 transition-all hover:-translate-y-0.5 hover:bg-brand-primary-dark"
                >
                  Browse All Products
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/order-now"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-sm font-bold text-brand-text shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary/30"
                >
                  Get a Quote
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 lg:justify-start">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-text-muted">
                  Trusted by businesses, schools, clubs and event organisers
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-brand-text">4.9/5 Rating</span>
                </div>
              </div>
            </div>

            {/* Right: Neutral/Mixed Visuals */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-12">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 shadow-xl ring-1 ring-black/5">
                    <Image src="/images/products/custom-labels.png" alt="Custom Labels" fill className="object-cover" />
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-xl ring-1 ring-black/5">
                    <Image src="/images/products/race-bibs.png" alt="Race Numbers" fill className="object-cover" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-xl ring-1 ring-black/5">
                    <Image src="/images/products/award-trophies.png" alt="Trophies" fill className="object-cover" />
                  </div>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 shadow-xl ring-1 ring-black/5">
                    <Image src="/images/products/mtb-number-boards.png" alt="MTB Boards" fill className="object-cover" />
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -right-4 top-1/2 z-20 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 lg:-right-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10">
                    <Zap className="h-6 w-6 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-text">24hr Turnaround</p>
                    <p className="text-xs text-brand-text-muted">Swift Dispatch Nationwide</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      
      {/* Trust bar / Proof Row */}
      <ProofRow />

      {/* ── 2. PRODUCT HUB ───────────────────────────────────────────── */}
      {/* BUG-011 FIX: id added so the /#bulk-orders nav anchor scrolls here */}
      <div id="bulk-orders">
        <ProductHub />
      </div>

      {/* ── 3. WHY SPEEDY ────────────────────────────────────────────── */}
      <section className="bg-brand-secondary py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-3xl font-bold text-white lg:text-4xl">
              Built for performance and reliability
            </h2>
            <p className="mt-4 text-white/60">
              Everything you need to print with confidence, every single time.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-white/5 bg-white/5 p-8 transition-all hover:bg-white/10"
              >
                <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
                <h3 className="font-heading text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ──────────────────────────────────────────── */}
      <HowItWorks />

      {/* ── 5. FEATURED WORK ─────────────────────────────────────────── */}
      <FeaturedWork />

      {/* ── 6. ONLINE DESIGNER TOOL ─────────────────────────────────── */}
      <DesignerDemo />

      {/* ── 7. TESTIMONIALS ─────────────────────────────────────────── */}
      <TestimonialsCarousel />

      {/* ── 8. INLINE FAQ ───────────────────────────────────────────── */}
      <HomeFAQ />

      {/* ── 9. CTA BAND ─────────────────────────────────────────────── */}
      <CTABand />

    </div>
  )
}
