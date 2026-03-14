import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants'
import { HeroCalculator } from '@/components/home/HeroCalculator'
import { HowItWorks } from '@/components/home/HowItWorks'
import { DivisionShowcase } from '@/components/home/DivisionShowcase'
import { TestimonialsCarousel } from '@/components/home/TestimonialsCarousel'

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
      'South Africa\'s online custom sticker and label printing platform. Instant pricing, online designer, fast delivery.',
    url: SITE_URL,
  },
}

export default function HomePage() {
  return (
    <div>
      {/* Hero Section with Embedded Calculator */}
      <section className="relative bg-gradient-to-br from-brand-secondary to-brand-secondary-light">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Left: Headline */}
            <div className="text-white">
              <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Premium Custom
                <span className="text-brand-primary"> Stickers</span>,{' '}
                <span className="text-brand-primary">Labels</span> &{' '}
                <span className="text-brand-primary">Decals</span>
              </h1>
              <p className="mt-6 text-lg text-white/80">
                Design, order, and receive high-quality custom stickers and
                labels. Fast turnaround, competitive pricing, and free delivery
                on orders over R500.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/order-now"
                  className="rounded-lg bg-brand-primary px-8 py-3 text-lg font-semibold text-white transition hover:bg-brand-primary-dark"
                >
                  Order Now
                </Link>
                <Link
                  href="/templates"
                  className="rounded-lg border border-white/30 px-8 py-3 text-lg font-semibold text-white transition hover:bg-white/10"
                >
                  Design Online
                </Link>
              </div>

              {/* Quick stats */}
              <div className="mt-10 grid grid-cols-3 gap-6">
                <div>
                  <p className="text-3xl font-bold text-brand-primary">5000+</p>
                  <p className="text-sm text-white/60">Happy Customers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-brand-primary">24hr</p>
                  <p className="text-sm text-white/60">Quick Turnaround</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-brand-primary">100%</p>
                  <p className="text-sm text-white/60">Quality Guaranteed</p>
                </div>
              </div>
            </div>

            {/* Right: Calculator */}
            <div className="lg:pl-8">
              <HeroCalculator />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Division Showcase */}
      <DivisionShowcase />

      {/* Testimonials */}
      <TestimonialsCarousel />

      {/* CTA Section */}
      <section className="bg-brand-primary py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Get an instant quote or design your stickers online today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/order-now"
              className="rounded-lg bg-white px-8 py-3 text-lg font-semibold text-brand-primary transition hover:bg-gray-100"
            >
              Get a Quote
            </Link>
            <Link
              href="/register"
              className="rounded-lg border-2 border-white px-8 py-3 text-lg font-semibold text-white transition hover:bg-white/10"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
