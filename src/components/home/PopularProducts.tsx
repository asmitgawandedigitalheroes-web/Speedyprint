import Link from 'next/link'

const POPULAR_TAGS = [
  // Labels division
  { label: 'Custom Labels', href: '/products/custom-labels' },
  { label: 'Vinyl Stickers', href: '/products/vinyl-stickers' },
  { label: 'Wristbands', href: '/products/wristbands' },
  { label: 'Car Magnets', href: '/products/car-magnets' },

  // Race numbers / events division
  { label: 'Race Numbers', href: '/products/race-numbers' },
  { label: 'Event Tags', href: '/products/event-tags' },

  // MTB & boards division
  { label: 'MTB Boards', href: '/products/mtb-boards' },
  { label: 'Bike Flaps', href: '/products/bike-flaps' },
  { label: 'Correx Boards', href: '/products/correx-boards' },

  // Print division
  { label: 'Flyers', href: '/products/flyers' },
  { label: 'Business Cards', href: '/products/business-cards' },
  { label: 'Brochures & Catalogues', href: '/products/brochures-catalogues' },
  { label: 'Note Pads', href: '/products/note-pads' },
  { label: 'Certificates', href: '/products/certificates' },
  { label: 'Envelopes', href: '/products/envelopes' },
  { label: 'Event Printing', href: '/products/event-printing' },
  { label: 'Self-Inking Stamps', href: '/products/self-inking-stamps' },
  { label: 'Coffee Cup Sleeves', href: '/products/coffee-cup-sleeves' },

  // Laser division
  { label: 'Acrylic Signs', href: '/products/acrylic-signs' },
  { label: 'Wooden Plaques', href: '/products/wooden-plaques' },
  { label: 'NFC Stands', href: '/products/nfc-stands' },

  // Trophies division
  { label: 'Award Trophies', href: '/products/award-trophies' },
]

export function PopularProducts() {
  return (
    <section className="bg-white py-14 border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-brand-text-muted">
          Popular Products &amp; Categories
        </h2>
        <div className="flex flex-wrap justify-center gap-2.5">
          {POPULAR_TAGS.map((tag) => (
            <Link
              key={tag.label}
              href={tag.href}
              className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-medium text-brand-text transition-colors hover:border-brand-primary hover:bg-brand-primary/5 hover:text-brand-primary"
            >
              {tag.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
