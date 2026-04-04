import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants'
import { Check } from 'lucide-react'

export const metadata: Metadata = {
  title: `About ${SITE_NAME} | Custom Printing in South Africa`,
  description:
    "Learn about Speedy Print Suite — South Africa's precision printing platform with six specialized divisions serving small businesses, makers, and event organisers.",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: `About ${SITE_NAME}`,
    description: 'Modern, precise, fast, and approachable — custom printing solutions across six specialized divisions.',
    url: `${SITE_URL}/about`,
  },
}

const DIVISIONS = [
  { name: 'Labels & Stickers', desc: 'Custom labels, stickers, and product packaging for any application' },
  { name: 'Speedy Race Numbers', desc: 'Professional race bibs and event numbering systems' },
  { name: 'Speedy MTB Boards', desc: 'Durable mountain bike number boards and cycling accessories' },
  { name: 'Speedy Laser', desc: 'Precision laser-cut and engraved signage, plaques, and gifts' },
  { name: 'Speedy Trophies', desc: 'Award trophies, medals, and recognition products' },
  { name: 'Speedy Print', desc: 'General commercial printing, branded materials, and coffee cup sleeves' },
]

const FEATURES = [
  'Online design tools — no software needed',
  'Digital proofing before production',
  'CSV bulk upload for event products',
  'Print-ready file generation',
  'Fast turnaround times',
]

export default function AboutPage() {
  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Page header */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-white">About {SITE_NAME}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/60">
            Modern, precise, and approachable — delivering custom printing solutions across six specialized divisions.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        {/* Intro */}
        <div className="rounded-md border border-gray-100 bg-white p-8">
          <p className="text-brand-text-muted leading-relaxed">
            Speedy Print Suite is a South African printing business built for small businesses, makers, and event organisers.
            Clean, technical, and warm — we combine industrial-grade precision with a personal, approachable service.
            From event race bibs to laser-cut signage, custom labels to branded coffee cup sleeves, we handle it all
            with speed and care.
          </p>
        </div>

        {/* Mission + Process */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-md border border-gray-100 bg-white p-6">
            <div className="h-1 w-8 bg-brand-primary mb-4" />
            <h3 className="font-heading text-lg font-semibold text-brand-text">Our mission</h3>
            <p className="mt-3 text-sm text-brand-text-muted leading-relaxed">
              To make custom printing accessible, fast, and effortless for businesses
              and event organisers across South Africa — with precision you can trust.
            </p>
          </div>
          <div className="rounded-md border border-gray-100 bg-white p-6">
            <div className="h-1 w-8 bg-brand-primary mb-4" />
            <h3 className="font-heading text-lg font-semibold text-brand-text">Our process</h3>
            <p className="mt-3 text-sm text-brand-text-muted leading-relaxed">
              Design online using our web-to-print tools, approve your digital proof,
              and we handle the rest — delivering production-ready files straight to press.
            </p>
          </div>
        </div>

        {/* Divisions */}
        <div>
          <h2 className="font-heading text-2xl font-bold text-brand-text mb-4">Our divisions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DIVISIONS.map((div) => (
              <div key={div.name} className="rounded-md border border-gray-100 bg-white p-5">
                <div className="h-1 w-6 bg-brand-primary mb-3" />
                <h3 className="font-semibold text-brand-text">{div.name}</h3>
                <p className="mt-1 text-sm text-brand-text-muted">{div.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why choose us */}
        <div className="rounded-md border-t-4 border-brand-primary bg-brand-secondary p-8">
          <h2 className="font-heading text-2xl font-bold text-white mb-6">Why choose us?</h2>
          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-white/80">
                <Check className="h-4 w-4 shrink-0 text-brand-primary" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

