import type { Metadata } from 'next'
import { Shield, Truck, Clock, Award, Palette, HeadphonesIcon, Leaf, CreditCard } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Why choose us',
  description: 'Discover why thousands of South African businesses trust Speedy for their custom print and fabrication needs.',
}

const REASONS = [
  { icon: Shield, title: 'Quality guaranteed', description: "We use only premium-grade vinyl and inks. Every order undergoes quality checks before shipping. If you're not satisfied, we'll reprint it." },
  { icon: Truck, title: 'Free delivery over R500', description: 'Free delivery on orders over R500, anywhere in South Africa. Standard delivery takes 3-5 business days, with express options available.' },
  { icon: Clock, title: 'Quick turnaround', description: 'Most orders are produced within 24-48 hours. We understand deadlines matter and work efficiently to get your order to you fast.' },
  { icon: Award, title: 'Premium materials', description: 'From white vinyl to holographic and 3D domed finishes, we offer a wide range of premium materials to suit any application.' },
  { icon: Palette, title: 'Online design tool', description: 'Design your products directly in your browser with our easy-to-use design wizard. No design software needed.' },
  { icon: HeadphonesIcon, title: 'Expert support', description: 'Our team of printing experts is available to help with artwork, material selection, and any questions you might have.' },
  { icon: Leaf, title: 'Eco-friendly options', description: 'We offer eco-friendly vinyl options and use sustainable practices in our production process wherever possible.' },
  { icon: CreditCard, title: 'Competitive pricing', description: 'Volume discounts starting from just 50 units. The more you order, the more you save — up to 35% off on orders of 1000+.' },
]

export default function WhyChooseUsPage() {
  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-white">Why choose us?</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            Trusted by thousands of businesses across South Africa for premium
            custom print and fabrication solutions.
          </p>
        </div>
      </div>

      {/* Reasons grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((reason) => (
              <div key={reason.title} className="rounded-md border border-gray-100 bg-white p-6 transition hover:shadow-md">
                <div className="h-1 w-8 bg-brand-primary mb-4" />
                <reason.icon className="h-5 w-5 text-brand-primary mb-3" />
                <h3 className="font-heading text-base font-semibold text-brand-text">{reason.title}</h3>
                <p className="mt-2 text-sm text-brand-text-muted">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-4 border-brand-primary bg-brand-secondary py-16">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="font-heading text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-4 text-white/60">Join thousands of businesses who trust us for their custom printing needs.</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/order-now" className="inline-flex items-center gap-2 rounded-md bg-white px-7 py-3 text-sm font-semibold text-brand-primary transition hover:bg-gray-50">
              Get instant quote
            </Link>
            <Link href="/products" className="inline-flex items-center rounded-md border-2 border-white/30 px-7 py-3 text-sm font-semibold text-white transition hover:border-white">
              Browse products
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
