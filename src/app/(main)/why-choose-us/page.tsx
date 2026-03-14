import type { Metadata } from 'next'
import { Shield, Truck, Clock, Award, Palette, HeadphonesIcon, Leaf, CreditCard } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `Why Choose Us | ${SITE_NAME}`,
  description: 'Discover why thousands of South African businesses trust SpeedyPrint for their custom stickers, labels, and decals.',
}

const REASONS = [
  { icon: Shield, title: 'Quality Guaranteed', description: 'We use only premium-grade vinyl and inks. Every order undergoes quality checks before shipping. If you\'re not satisfied, we\'ll reprint it.' },
  { icon: Truck, title: 'Free Delivery Over R500', description: 'Free delivery on orders over R500, anywhere in South Africa. Standard delivery takes 3-5 business days, with express options available.' },
  { icon: Clock, title: 'Quick Turnaround', description: 'Most orders are produced within 24-48 hours. We understand deadlines matter and work efficiently to get your stickers to you fast.' },
  { icon: Award, title: 'Premium Materials', description: 'From white vinyl to holographic and 3D domed finishes, we offer a wide range of premium materials to suit any application.' },
  { icon: Palette, title: 'Online Design Tool', description: 'Design your stickers directly in your browser with our easy-to-use design wizard. No design software needed.' },
  { icon: HeadphonesIcon, title: 'Expert Support', description: 'Our team of printing experts is available to help with artwork, material selection, and any questions you might have.' },
  { icon: Leaf, title: 'Eco-Friendly Options', description: 'We offer eco-friendly vinyl options and use sustainable practices in our production process wherever possible.' },
  { icon: CreditCard, title: 'Competitive Pricing', description: 'Volume discounts starting from just 50 units. The more you order, the more you save — up to 35% off on orders of 1000+.' },
]

export default function WhyChooseUsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-brand-secondary py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold">Why Choose SpeedyPrint?</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Trusted by thousands of businesses across South Africa for premium
            custom stickers, labels, and decals.
          </p>
        </div>
      </section>

      {/* Reasons Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((reason) => (
              <div key={reason.title} className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-primary/10">
                  <reason.icon className="h-6 w-6 text-brand-primary" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-brand-text">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sm text-brand-text-muted">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
