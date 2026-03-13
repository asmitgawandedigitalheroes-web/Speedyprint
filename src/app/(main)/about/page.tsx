import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `About ${SITE_NAME} | Custom Printing in South Africa`,
  description:
    'Learn about SpeedyPrint — South Africa\'s custom printing platform with five specialized divisions: labels, laser cutting, event numbers, stamps, and trophies.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: `About ${SITE_NAME}`,
    description: 'South African printing business delivering custom solutions across five specialized divisions.',
    url: `${SITE_URL}/about`,
  },
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-brand-black">About {SITE_NAME}</h1>

      <div className="mt-8 space-y-8 text-lg leading-relaxed text-brand-gray">
        <p>
          SpeedyPrint is a South African printing business delivering custom printing solutions
          across five specialized divisions. From event race bibs to laser-cut signage, custom labels
          to branded coffee cup sleeves, we handle it all with precision and speed.
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-brand-gray-light bg-white p-6">
            <h3 className="text-xl font-semibold text-brand-black">Our Mission</h3>
            <p className="mt-3 text-base text-brand-gray-medium">
              To make custom printing accessible, affordable, and effortless for businesses
              and event organizers across South Africa.
            </p>
          </div>
          <div className="rounded-xl border border-brand-gray-light bg-white p-6">
            <h3 className="text-xl font-semibold text-brand-black">Our Process</h3>
            <p className="mt-3 text-base text-brand-gray-medium">
              Design online using our web-to-print tools, approve your digital proof,
              and we handle the rest — delivering production-ready files straight to press.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-brand-black">Our Divisions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'Speedy Labels', desc: 'Custom labels and stickers for any application' },
            { name: 'Speedy Laser', desc: 'Precision laser-cut and engraved products' },
            { name: 'Speedy Event Numbers', desc: 'Race bibs, event tags, and MTB boards' },
            { name: 'Speedy Stamps', desc: 'Custom rubber stamps for businesses' },
            { name: 'Speedy Trophies', desc: 'Branded coffee sleeves and trophies' },
          ].map((div) => (
            <div key={div.name} className="rounded-lg border border-brand-gray-light p-4">
              <h3 className="font-semibold text-brand-red">{div.name}</h3>
              <p className="mt-1 text-sm text-brand-gray-medium">{div.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-brand-bg p-8">
          <h2 className="text-2xl font-bold text-brand-black">Why Choose Us?</h2>
          <ul className="mt-4 space-y-3 text-base">
            <li className="flex gap-3"><span className="text-brand-red font-bold">&#10003;</span> Online design tools — no software needed</li>
            <li className="flex gap-3"><span className="text-brand-red font-bold">&#10003;</span> Digital proofing before production</li>
            <li className="flex gap-3"><span className="text-brand-red font-bold">&#10003;</span> CSV bulk upload for event products</li>
            <li className="flex gap-3"><span className="text-brand-red font-bold">&#10003;</span> Print-ready file generation</li>
            <li className="flex gap-3"><span className="text-brand-red font-bold">&#10003;</span> Fast turnaround times</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
