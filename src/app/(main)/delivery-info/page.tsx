import type { Metadata } from 'next'
import { Truck, Zap, MapPin } from 'lucide-react'
import { SITE_NAME, FREE_DELIVERY_THRESHOLD, FLAT_SHIPPING_RATE, CURRENCY_SYMBOL } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `Delivery information | ${SITE_NAME}`,
  description: 'Free delivery on orders over R500. Standard 3-5 day delivery across South Africa. Express and collection options available.',
}

const DELIVERY_TIERS = [
  {
    icon: Truck,
    title: 'Standard delivery',
    time: '3–5 business days',
    price: `${CURRENCY_SYMBOL}${FLAT_SHIPPING_RATE}`,
    freeNote: `Free on orders over ${CURRENCY_SYMBOL}${FREE_DELIVERY_THRESHOLD}`,
    description: 'Reliable door-to-door delivery via our trusted courier partners. Tracking provided.',
  },
  {
    icon: Zap,
    title: 'Express delivery',
    time: '1–2 business days',
    price: `${CURRENCY_SYMBOL}150`,
    freeNote: null,
    description: 'Priority production and overnight courier delivery. Perfect for urgent orders.',
  },
  {
    icon: MapPin,
    title: 'Collection',
    time: 'Same day',
    price: 'Free',
    freeNote: null,
    description: 'Collect from our Cape Town facility. Orders placed before 10am can be ready same day.',
  },
]

export default function DeliveryInfoPage() {
  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-white">Delivery information</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Fast, reliable delivery across South Africa. Free shipping on orders over {CURRENCY_SYMBOL}{FREE_DELIVERY_THRESHOLD}.
          </p>
        </div>
      </div>

      {/* Tiers */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {DELIVERY_TIERS.map((tier) => (
              <div key={tier.title} className="rounded-md border border-gray-100 bg-white p-7 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-gray-100 bg-brand-bg">
                  <tier.icon className="h-5 w-5 text-brand-primary" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-brand-text">{tier.title}</h3>
                <p className="mt-2 font-heading text-2xl font-bold text-brand-primary">{tier.price}</p>
                {tier.freeNote && (
                  <p className="mt-1 text-xs font-semibold text-brand-accent">{tier.freeNote}</p>
                )}
                <p className="mt-1 text-xs text-brand-text-muted">{tier.time}</p>
                <p className="mt-4 text-sm text-brand-text-muted">{tier.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="bg-brand-bg py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-text">Nationwide coverage</h2>
          </div>
          <p className="text-brand-text-muted">
            We deliver to all 9 provinces across South Africa including Gauteng, Western Cape,
            KwaZulu-Natal, Eastern Cape, Free State, Limpopo, Mpumalanga, North West, and Northern Cape.
          </p>

          <div className="mt-8 rounded-md border border-gray-100 bg-white p-6">
            <h3 className="font-heading text-base font-semibold text-brand-text mb-4">Important notes</h3>
            <ul className="space-y-2 text-sm text-brand-text-muted">
              {[
                'Delivery times are estimates and may vary depending on location.',
                'Orders placed after 2pm may be processed the following business day.',
                'Public holidays may affect delivery times.',
                'Tracking numbers are provided via email once your order is dispatched.',
                'For bulk orders (1000+ units), please contact us for custom delivery arrangements.',
              ].map((note, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
