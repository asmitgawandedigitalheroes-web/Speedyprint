import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `Our Story | ${SITE_NAME}`,
  description: 'Learn about SpeedyPrint\'s journey from a small printing shop to South Africa\'s leading online custom sticker and label platform.',
}

const MILESTONES = [
  { year: '2015', title: 'The Beginning', description: 'Started as a small printing workshop in Cape Town, focusing on quality and customer service.' },
  { year: '2017', title: 'Going Digital', description: 'Launched our first online ordering system, making it easier for customers across South Africa to order.' },
  { year: '2019', title: 'Expansion', description: 'Expanded our product range to include vehicle decals, window graphics, and 3D domed stickers.' },
  { year: '2021', title: 'Online Design Tool', description: 'Introduced our online design wizard, allowing customers to create custom designs directly in their browser.' },
  { year: '2023', title: 'National Coverage', description: 'Achieved full national delivery coverage with free shipping on orders over R500.' },
  { year: '2024', title: 'Industry Leader', description: 'Became one of South Africa\'s most trusted online sticker and label printing platforms.' },
]

export default function OurStoryPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-brand-secondary py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold">Our Story</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            From a small printing workshop to South Africa&apos;s leading online
            custom sticker and label platform.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 h-full w-0.5 bg-brand-primary/20 md:left-1/2" />

            {MILESTONES.map((milestone, i) => (
              <div
                key={milestone.year}
                className={`relative mb-12 flex items-start gap-8 ${
                  i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Dot */}
                <div className="absolute left-8 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-brand-primary md:left-1/2" />

                {/* Content */}
                <div className={`ml-16 w-full md:ml-0 md:w-5/12 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                  <span className="text-sm font-bold text-brand-primary">{milestone.year}</span>
                  <h3 className="mt-1 font-heading text-xl font-semibold text-brand-text">{milestone.title}</h3>
                  <p className="mt-2 text-brand-text-muted">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-brand-bg py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-heading text-3xl font-bold text-brand-text">
            Our Values
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { title: 'Quality First', description: 'We use premium materials and state-of-the-art printing technology to ensure every sticker meets our exacting standards.' },
              { title: 'Customer Focus', description: 'Your satisfaction is our priority. We work closely with every client to deliver exactly what they need.' },
              { title: 'Innovation', description: 'We continuously invest in new technology and techniques to stay at the forefront of the printing industry.' },
            ].map((value) => (
              <div key={value.title} className="rounded-xl bg-white p-8 shadow-sm">
                <h3 className="font-heading text-lg font-semibold text-brand-text">{value.title}</h3>
                <p className="mt-3 text-brand-text-muted">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
