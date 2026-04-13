import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `Our story | ${SITE_NAME}`,
  description: 'Learn about Speedy’s journey from a small printing workshop to South Africa’s trusted printing partner for businesses and makers.',
}

const MILESTONES = [
  { year: '2015', title: 'The beginning', description: 'Started as a small printing workshop in Randburg, Gauteng, focusing on quality and customer service.' },
  { year: '2017', title: 'Going digital', description: 'Launched our first online ordering system, making it easier for customers across South Africa to order.' },
  { year: '2019', title: 'Expansion', description: 'Expanded our product range to include vehicle decals, window graphics, and 3D domed stickers.' },
  { year: '2021', title: 'Online design tool', description: 'Introduced our online design wizard, allowing customers to create custom designs directly in their browser.' },
  { year: '2023', title: 'National coverage', description: 'Achieved full national delivery coverage with free shipping on orders over R500.' },
  { year: '2024', title: 'Industry leader', description: 'Became one of South Africa\'s most trusted online custom print and fabrication platforms.' },
]

const VALUES = [
  { title: 'Precision first', description: 'We use premium materials and state-of-the-art technology to ensure every product meets exacting standards — clean, technical, pixel-perfect.' },
  { title: 'Fast and approachable', description: 'Speed without compromise. We work closely with every client — from makers to large businesses — to deliver exactly what they need, on time.' },
  { title: 'Modern innovation', description: 'We continuously invest in new technology and processes to stay at the forefront of the printing industry — because your brand deserves the best.' },
]

export default function OurStoryPage() {
  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="border-b border-gray-100 bg-brand-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-4xl font-bold text-white">Our story</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            From a small printing workshop to South Africa&apos;s trusted
            printing partner for small businesses, makers, and event organisers.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-3xl font-bold text-brand-text">Our journey</h2>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-0 h-full w-px bg-brand-primary/20 md:left-1/2" />
            {MILESTONES.map((milestone, i) => (
              <div
                key={milestone.year}
                className={`relative mb-12 flex items-start gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                <div className="absolute left-4 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-brand-primary md:left-1/2" />
                <div className={`ml-12 w-full md:ml-0 md:w-5/12 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                  <span className="text-xs font-bold tracking-widest uppercase text-brand-primary">{milestone.year}</span>
                  <h3 className="mt-1 font-heading text-lg font-semibold text-brand-text">{milestone.title}</h3>
                  <p className="mt-2 text-sm text-brand-text-muted">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-brand-bg py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-3xl font-bold text-brand-text">Our values</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {VALUES.map((value) => (
              <div key={value.title} className="rounded-md border border-gray-100 bg-white p-6">
                <div className="mb-4 h-1 w-8 bg-brand-primary" />
                <h3 className="font-heading text-lg font-semibold text-brand-text">{value.title}</h3>
                <p className="mt-2 text-sm text-brand-text-muted">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
