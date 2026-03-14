import type { Metadata } from 'next'
import { Truck, Zap, MapPin } from 'lucide-react'
import { SITE_NAME, FREE_DELIVERY_THRESHOLD, FLAT_SHIPPING_RATE, CURRENCY_SYMBOL } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `Delivery Information | ${SITE_NAME}`,
  description: 'Free delivery on orders over R500. Standard 3-5 day delivery across South Africa. Express and collection options available.',
}

const DELIVERY_TIERS = [
  {
    icon: Truck,
    title: 'Standard Delivery',
    time: '3-5 Business Days',
    price: `${CURRENCY_SYMBOL}${FLAT_SHIPPING_RATE}`,
    freeNote: `FREE on orders over ${CURRENCY_SYMBOL}${FREE_DELIVERY_THRESHOLD}`,
    description: 'Reliable door-to-door delivery via our trusted courier partners. Tracking provided.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Zap,
    title: 'Express Delivery',
    time: '1-2 Business Days',
    price: `${CURRENCY_SYMBOL}150`,
    freeNote: null,
    description: 'Priority production and overnight courier delivery. Perfect for urgent orders.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: MapPin,
    title: 'Collection',
    time: 'Same Day',
    price: 'FREE',
    freeNote: null,
    description: 'Collect from our Cape Town facility. Orders placed before 10am can be ready same day.',
    color: 'bg-green-50 text-green-600',
  },
]

export default function DeliveryInfoPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-brand-secondary py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold">Delivery Information</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Fast, reliable delivery across South Africa. Free shipping on orders
            over {CURRENCY_SYMBOL}{FREE_DELIVERY_THRESHOLD}.
          </p>
        </div>
      </section>

      {/* Delivery Tiers */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {DELIVERY_TIERS.map((tier) => (
              <div key={tier.title} className="rounded-xl border bg-white p-8 shadow-sm text-center">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${tier.color}`}>
                  <tier.icon className="h-8 w-8" />
                </div>
                <h3 className="mt-4 font-heading text-xl font-semibold text-brand-text">{tier.title}</h3>
                <p className="mt-2 text-2xl font-bold text-brand-primary">{tier.price}</p>
                {tier.freeNote && (
                  <p className="mt-1 text-sm font-medium text-brand-accent">{tier.freeNote}</p>
                )}
                <p className="mt-1 text-sm text-brand-text-muted">{tier.time}</p>
                <p className="mt-4 text-sm text-brand-text-muted">{tier.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="bg-brand-bg py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-brand-text">Nationwide Coverage</h2>
          <p className="mt-4 text-brand-text-muted">
            We deliver to all 9 provinces across South Africa including Gauteng,
            Western Cape, KwaZulu-Natal, Eastern Cape, Free State, Limpopo,
            Mpumalanga, North West, and Northern Cape.
          </p>
          <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="font-heading text-lg font-semibold text-brand-text">Important Notes</h3>
            <ul className="mt-4 space-y-2 text-left text-sm text-brand-text-muted">
              <li>• Delivery times are estimates and may vary depending on location.</li>
              <li>• Orders placed after 2pm may be processed the following business day.</li>
              <li>• Public holidays may affect delivery times.</li>
              <li>• Tracking numbers are provided via email once your order is dispatched.</li>
              <li>• For bulk orders (1000+ units), please contact us for custom delivery arrangements.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
