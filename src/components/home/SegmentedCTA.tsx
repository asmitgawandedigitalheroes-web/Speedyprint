import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'

export function SegmentedCTA() {
  return (
    <section className="relative overflow-hidden bg-brand-secondary py-20 lg:py-28">
      {/* Decorative radial gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(227,6,19,0.18) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-white/50">
          Ready to get started?
        </p>

        {/* Two-path grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:divide-x lg:divide-white/10">

          {/* Path 1 — Standard buyer */}
          <div className="flex flex-col items-center rounded-2xl bg-white/5 px-8 py-10 text-center ring-1 ring-white/10 lg:rounded-none lg:bg-transparent lg:ring-0 lg:py-8">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-primary">
              Standard order
            </p>
            <h2 className="font-heading text-2xl font-bold text-white lg:text-3xl">
              Get an instant quote
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/70">
              Real-time pricing on any size, material, and quantity. No account needed to see your price.
            </p>
            <Link
              href="/order-now"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
            >
              Start your order <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Path 2 — Bulk / variable-data */}
          <div className="flex flex-col items-center rounded-2xl bg-white/5 px-8 py-10 text-center ring-1 ring-white/10 lg:rounded-none lg:bg-transparent lg:ring-0 lg:py-8">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/50">
              High-volume & bulk
            </p>
            <h2 className="font-heading text-2xl font-bold text-white lg:text-3xl">
              Talk to us about bulk jobs
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/70">
              CSV batch printing, fleet decals, race bibs, variable-data runs — handled end-to-end by our team.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" /> Contact us about bulk
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
