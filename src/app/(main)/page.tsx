import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants'
import { HowItWorks } from '@/components/home/HowItWorks'
import { DivisionShowcase } from '@/components/home/DivisionShowcase'
import { TestimonialsCarousel } from '@/components/home/TestimonialsCarousel'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: `${SITE_NAME} | Custom Stickers, Labels & Decals in South Africa`,
  description:
    'Premium custom stickers, product labels, vehicle decals, and 3D domed stickers. Get an instant quote, design online, and order. Fast delivery across South Africa.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: `${SITE_NAME} | Custom Stickers & Labels Made Simple`,
    description:
      "South Africa's online custom sticker and label printing platform. Instant pricing, online designer, fast delivery.",
    url: SITE_URL,
  },
}

const PRODUCT_CARDS = [
  {
    title: 'Product labels',
    description: 'Professional labels for bottles, packaging, and retail products.',
    image: '/images/products/custom-labels.png',
    href: '/products/product-labels',
    tag: 'Popular',
  },
  {
    title: 'Vinyl stickers',
    description: 'Eye-catching stickers for marketing, events, and giveaways.',
    image: '/images/products/vinyl-stickers.png',
    href: '/products/promotional-stickers',
    tag: 'Best seller',
  },
  {
    title: 'Vehicle decals',
    description: 'Durable vinyl decals for cars, trucks, and business vehicles.',
    image: '/images/products/custom-labels.png',
    href: '/products/vehicle-decals',
    tag: null,
  },
]

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">

            {/* Left: headline + CTAs + stats */}
            <div className="space-y-8">
              {/* Eyebrow tag — teal accent, used only here */}
              <span className="inline-block rounded-sm bg-brand-accent/10 px-3 py-1 text-xs font-semibold tracking-widest text-brand-accent uppercase">
                South Africa&apos;s custom print platform
              </span>

              <div className="space-y-4">
                <h1 className="font-heading text-5xl font-bold tracking-tight text-brand-text capitalize lg:text-6xl">
                  Premium labels<br />
                  &amp; stickers,<br />
                  <span className="text-brand-primary">printed fast.</span>
                </h1>
                <p className="max-w-md text-lg text-brand-text-muted">
                  Design online, get an instant quote, and receive professional
                  quality prints delivered anywhere in South Africa.
                </p>
              </div>

              {/* CTA row */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/order-now"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  Get instant quote
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/templates"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-7 py-3 text-sm font-semibold text-brand-text transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  Browse templates
                </Link>
              </div>

              {/* Stats row with dividers */}
              <div className="flex items-center gap-0 divide-x divide-gray-200 pt-4">
                <div className="pr-8">
                  <p className="font-heading text-2xl font-bold text-brand-text">5 000+</p>
                  <p className="mt-0.5 text-xs text-brand-text-muted">Happy clients</p>
                </div>
                <div className="px-8">
                  <p className="font-heading text-2xl font-bold text-brand-text">24 hr</p>
                  <p className="mt-0.5 text-xs text-brand-text-muted">Turnaround</p>
                </div>
                <div className="pl-8">
                  <p className="font-heading text-2xl font-bold text-brand-text">100%</p>
                  <p className="mt-0.5 text-xs text-brand-text-muted">Quality guaranteed</p>
                </div>
              </div>
            </div>

            {/* Right: product image with orange accent */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-brand-primary" />
              <div className="overflow-hidden rounded-lg bg-brand-bg">
                <img
                  src="/images/products/custom-labels.png"
                  alt="Custom labels and stickers"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Product showcase ─────────────────────────────────── */}
      <section className="bg-brand-bg py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header: left-aligned + right link */}
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-3xl font-bold text-brand-text capitalize">
                Products for every application
              </h2>
              <p className="mt-2 text-brand-text-muted">
                From product labels to vehicle graphics — we cover it all.
              </p>
            </div>
            <Link
              href="/products"
              className="shrink-0 text-sm font-medium text-brand-primary hover:text-brand-primary-dark"
            >
              View all products →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PRODUCT_CARDS.map((card) => (
              <div
                key={card.title}
                className="group overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Image */}
                <div className="relative aspect-video overflow-hidden bg-brand-bg">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {card.tag && (
                    <span className="absolute left-3 top-3 rounded-sm bg-brand-accent px-2 py-0.5 text-xs font-semibold text-white">
                      {card.tag}
                    </span>
                  )}
                </div>
                {/* Content */}
                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold text-brand-text capitalize">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm text-brand-text-muted">{card.description}</p>
                  <Link
                    href={card.href}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:text-brand-primary-dark"
                  >
                    Shop now <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <HowItWorks />

      {/* ── Division showcase ────────────────────────────────── */}
      <DivisionShowcase />

      {/* ── Testimonials ─────────────────────────────────────── */}
      <TestimonialsCarousel />

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="border-t-4 border-brand-primary bg-brand-secondary py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-4xl font-bold text-white capitalize">
            Ready to start your project?
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Join thousands of satisfied customers who trust us for their
            custom printing needs.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/order-now"
              className="inline-flex items-center gap-2 rounded-md bg-white px-8 py-3 text-sm font-semibold text-brand-primary transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary"
            >
              Get instant quote
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-md border-2 border-white/30 px-8 py-3 text-sm font-semibold text-white transition hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
