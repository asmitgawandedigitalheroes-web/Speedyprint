import Image from 'next/image'

const EXAMPLES = [
  {
    category: 'Labels',
    title: 'Custom Product Packaging',
    image: '/images/products/custom-labels.png',
  },
  {
    category: 'Race Numbers',
    title: 'Professional Event Bibs',
    image: '/images/products/race-bibs.png',
  },
  {
    category: 'Trophies',
    title: 'Custom Recognition Awards',
    image: '/images/products/award-trophies.png',
  },
  {
    category: 'MTB Boards',
    title: 'Durable Number Boards',
    image: '/images/products/mtb-number-boards.png',
  },
]

export function FeaturedWork() {
  return (
    <section className="bg-brand-bg py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading text-3xl font-bold text-brand-text sm:text-4xl">
            See what we create
          </h2>
          <p className="mt-4 text-brand-text-muted">
            From precision-cut labels to event equipment and trophies.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {EXAMPLES.map((example) => (
            <div
              key={example.title}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-lg"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={example.image}
                  alt={example.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                  {example.category}
                </span>
                <h3 className="mt-1 font-heading text-sm font-bold text-brand-text">
                  {example.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
