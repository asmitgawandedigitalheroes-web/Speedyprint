import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants'
import { TestimonialsCarousel } from '@/components/home/TestimonialsCarousel'
import { FeatureStrip } from '@/components/home/FeatureStrip'
import {
  ArrowRight,
  Star,
  Palette,
  SlidersHorizontal,
  Printer,
  Truck,
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

const PRODUCT_CARDS = [
  {
    title: 'Product Labels',
    desc: 'High adhesion. Matte, gloss, or textured finishes.',
    tag: 'BEST SELLER',
    image: '/images/products/custom-labels.png',
    href: '/products/custom-labels',
  },
  {
    title: 'Vinyl Stickers',
    desc: 'Waterproof, UV-resistant, cut to any shape.',
    tag: null,
    image: '/images/products/vinyl-stickers.png',
    href: '/products/vinyl-stickers',
  },
  {
    title: 'Vehicle Decals',
    desc: 'Fleet graphics that endure any weather.',
    tag: null,
    image: '/images/products/custom-labels.png',
    href: '/products?division=labels',
  },
  {
    title: 'Window Graphics',
    desc: 'Perforated or solid — installed in minutes.',
    tag: 'WEATHER RESISTANT',
    image: '/images/products/acrylic-signs.png',
    href: '/products?division=print',
  },
]

const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Design',
    description: 'Upload your artwork or use our free online editor with 1,200+ templates.',
    icon: Palette,
  },
  {
    number: '02',
    title: 'Configure',
    description: 'Pick your size, material, and finish. See your price update in real time.',
    icon: SlidersHorizontal,
  },
  {
    number: '03',
    title: 'We Print',
    description: 'Industrial-grade presses deliver pixel-perfect colour accuracy every time.',
    icon: Printer,
  },
  {
    number: '04',
    title: 'We Deliver',
    description: 'Tracked express shipping to your door within 24–48 hours.',
    icon: Truck,
  },
]

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

const TICKER_ITEMS = [
  'Same Day Dispatch',
  'Free Delivery over R500',
  '5,000+ Happy Clients',
  '4.9★ Customer Rated',
  'Custom Shapes & Sizes',
  'Eco-Certified Inks',
  '24-Hour Turnaround',
  'Online Designer Tool',
]

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative bg-white">

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">

            {/* ── Left: text content ── */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 backdrop-blur-md">
                <div className="h-1 w-1 animate-pulse rounded-full bg-yellow-400" />
                <span className="text-[10px] font-bold tracking-widest text-yellow-400">
                  SOUTH AFRICA'S TRUSTED LABEL & STICKER PARTNER
                </span>
              </div>

              {/* Headline */}
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

              {/* CTA buttons */}
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
                  Browse Templates
                </Link>
              </div>

              {/* Social proof */}
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

            {/* ── Right: hero image ── */}
            <div className="relative">
              {/* Floating badge: turnaround */}
              <div className="absolute -left-4 top-8 z-10 flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/5 lg:-left-8">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                  <Zap className="h-4 w-4 text-brand-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-text">24hr Turnaround</p>
                  <p className="text-[10px] text-brand-text-muted">Same day dispatch</p>
                </div>
              </div>

              {/* Floating badge: clients */}
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

      {/* ── TICKER ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-white/10 bg-brand-secondary py-3.5">
        <div className="flex animate-[marquee_35s_linear_infinite] whitespace-nowrap">
          {[...Array(4)].map((_, gi) => (
            <span
              key={gi}
              className="inline-flex shrink-0 items-center gap-8 px-6 text-[11px] font-semibold uppercase tracking-widest text-white/50"
            >
              {TICKER_ITEMS.map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="text-brand-primary">✦</span> {item}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>




      {/* ── STATS STRIP ────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-gray-100 border-y border-gray-100 lg:grid-cols-4">
            {[
              { value: '4.9/5', label: 'Customer Rating', stars: true },
              { value: '5,000+', label: 'Happy Clients', stars: false },
              { value: '24hr', label: 'Avg. Turnaround', stars: false },
              { value: '100%', label: 'Eco-Certified Ink', stars: false },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center gap-1 px-6 py-6 lg:py-10"
              >
                {stat.stars && (
                  <div className="mb-1 flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-brand-accent text-brand-accent" strokeWidth={1.5} />
                    ))}
                  </div>
                )}
                <p className="font-heading text-3xl font-bold text-brand-text">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-wider text-brand-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── PRODUCTS ───────────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-yellow-400">
                Our Products
              </p>
              <h2 className="font-heading text-3xl font-bold capitalize text-brand-text lg:text-4xl">
                Precision Print Solutions
              </h2>
              <p className="mt-2 text-brand-text-muted">
                Every substrate, texture, and finish selected for peak professional performance.
              </p>
            </div>
            <Link
              href="/products"
              className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary/40 hover:text-brand-primary"
            >
              Full Catalog
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Large card — spans 2 rows on lg */}
            <Link
              href={PRODUCT_CARDS[0].href}
              className="group relative overflow-hidden rounded-3xl bg-gray-100 lg:row-span-2"
            >
              <div className="relative h-64 lg:h-full lg:min-h-[520px]">
                <Image
                  src={PRODUCT_CARDS[0].image}
                  alt={PRODUCT_CARDS[0].title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <span className="absolute left-5 top-5 rounded-full bg-brand-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                  {PRODUCT_CARDS[0].tag}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <h3 className="font-heading text-2xl font-bold text-white">
                    {PRODUCT_CARDS[0].title}
                  </h3>
                  <p className="mt-1.5 text-sm text-white/70">{PRODUCT_CARDS[0].desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 transition group-hover:bg-white group-hover:text-brand-text">
                    Shop Now <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>

            {/* 3 smaller cards */}
            {PRODUCT_CARDS.slice(1).map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group relative overflow-hidden rounded-3xl bg-gray-100"
              >
                <div className="relative h-60">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  {card.tag && (
                    <span className="absolute left-4 top-4 rounded-full bg-brand-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                      {card.tag}
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-heading text-xl font-bold text-white">{card.title}</h3>
                    <p className="mt-1 text-xs text-white/70">{card.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/20 transition group-hover:bg-white group-hover:text-brand-text">
                      Shop Now <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ─────────────────────────────────────────────────── */}
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

      {/* ── BATCH GENERATION ───────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
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
                  'Checkout entire batches as a single cart item'
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

            {/* Abstract visual representation of CSV -> Print */}
            <div className="relative aspect-square w-full rounded-3xl bg-brand-bg p-8 flex flex-col items-center justify-center lg:aspect-auto lg:h-[500px]">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:1rem_1rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />

              <div className="relative z-10 flex w-full max-w-sm flex-col gap-4">
                {/* Mock CSV Row */}
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

                {/* Arrow */}
                <div className="flex justify-center text-brand-primary">
                  <svg className="h-6 w-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                {/* Mock Print Stack */}
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

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <FeatureStrip />


      {/* ── TRY SECTION ────────────────────────────────────────────── */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-brand-bg p-8 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(227,6,19,0.05),transparent_50%)]" />
            <div className="relative z-10 flex flex-col items-center justify-between gap-10 lg:flex-row">
              <div className="max-w-md text-center lg:text-left">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-yellow-400">
                  Instant Design Experience
                </p>
                <h2 className="font-heading text-2xl font-bold text-brand-text sm:text-3xl lg:text-4xl">
                  Try it Now — <br className="hidden lg:block" /> No Account Needed
                </h2>
                <p className="mt-4 text-sm text-brand-text-muted sm:text-base">
                  Test our industrial-grade designer tool. Upload your logo or use our templates to see how your brand looks on premium substrates.
                </p>
              </div>

              <div className="w-full max-w-lg">
                <Link
                  href="/products"
                  className="group relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-brand-primary/20 bg-white/50 transition-all hover:border-brand-primary/40 hover:bg-white"
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 transition-transform group-hover:scale-110">
                    <Printer className="h-8 w-8 text-brand-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-brand-text">Click to Upload Artwork</p>
                    <p className="text-base text-brand-text-muted mt-1">Design your first project in seconds</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="bg-brand-bg py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-yellow-400">
              The Process
            </p>
            <h2 className="font-heading text-3xl font-bold capitalize text-brand-text lg:text-4xl">
              Turning Concepts into Tangible Results            </h2>
            <p className="mt-3 text-brand-text-muted">
              Streamlined from initial concept to your front door. No friction, just results.
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connecting line */}
            <div
              className="absolute left-[12.5%] right-[12.5%] top-11 hidden h-px lg:block"
              style={{
                background:
                  'linear-gradient(to right, transparent, #E30613 20%, #E30613 80%, transparent)',
                opacity: 0.15,
              }}
              aria-hidden
            />

            {PROCESS_STEPS.map((step) => (
              <div
                key={step.number}
                className="relative flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-7"
              >
                <span className="absolute right-5 top-4 select-none font-heading text-5xl font-bold text-brand-primary/[0.07]">
                  {step.number}
                </span>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10">
                  <step.icon className="h-5 w-5 text-brand-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-brand-text">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <TestimonialsCarousel />

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-primary-dark py-20 lg:py-28">

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-yellow-400">
            Get Started Today
          </p>
          <h2 className="font-heading text-4xl font-extrabold capitalize text-white sm:text-5xl lg:text-6xl">
            Ready to bring your<br />project to life?
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/65">
            Experience the difference of industrial-grade printing. High-fidelity
            results, guaranteed speed — every order.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/order-now"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-brand-primary shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
            >
              Order Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center rounded-xl border-2 border-white/25 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/60 sm:w-auto"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
