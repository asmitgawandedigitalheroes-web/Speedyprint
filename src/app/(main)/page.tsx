import Link from 'next/link'
import { DIVISIONS, SITE_NAME } from '@/lib/utils/constants'

const iconMap: Record<string, string> = {
  labels: '🏷️',
  laser: '⚡',
  events: '🏃',
  stamps: '📌',
  sleeves: '🏆',
}

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-brand-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Custom Printing
              <span className="text-brand-red"> Made Simple</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300">
              Design, customize, and order professional printed products online.
              From labels to laser-cut signs, event numbers to custom stamps —
              all with production-ready quality.
            </p>
            <div className="mt-10 flex gap-4">
              <Link
                href="/products"
                className="rounded-lg bg-brand-red px-8 py-3 text-lg font-semibold text-white transition hover:bg-brand-red-light"
              >
                Browse Products
              </Link>
              <Link
                href="/about"
                className="rounded-lg border border-white/30 px-8 py-3 text-lg font-semibold text-white transition hover:bg-white/10"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Divisions */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-brand-black">Our Divisions</h2>
            <p className="mt-4 text-lg text-brand-gray-medium">
              Five specialized divisions to serve all your printing needs
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DIVISIONS.map((division) => (
              <Link
                key={division.key}
                href={`/products?division=${division.key}`}
                className="group rounded-xl border border-brand-gray-light bg-white p-8 shadow-sm transition hover:border-brand-red hover:shadow-md"
              >
                <div className="text-4xl">{iconMap[division.key]}</div>
                <h3 className="mt-4 text-xl font-semibold text-brand-black group-hover:text-brand-red">
                  {division.name}
                </h3>
                <p className="mt-2 text-brand-gray-medium">{division.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-brand-bg py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-brand-black">How It Works</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-4">
            {[
              { step: '1', title: 'Choose Product', desc: 'Select from our range of printing options' },
              { step: '2', title: 'Customize Design', desc: 'Use our online designer or upload artwork' },
              { step: '3', title: 'Approve Proof', desc: 'Review your digital proof before printing' },
              { step: '4', title: 'We Print & Ship', desc: 'Production-ready files go straight to press' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red text-xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-brand-black">{item.title}</h3>
                <p className="mt-2 text-brand-gray-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-red py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-4 text-lg text-white/80">
            Create an account and start designing your custom print products today.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-lg font-semibold text-brand-red transition hover:bg-gray-100"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  )
}
