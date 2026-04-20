'use client'

import Link from 'next/link'
import { Tag, Hash, Bike, Stamp, Trophy, Zap, ArrowRight, Printer } from 'lucide-react'

const PRODUCTS = [
  {
    name: 'Labels',
    description: 'Short-run stickers and packaging',
    href: '/products?division=labels',
    icon: Tag,
    color: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    name: 'Race Numbers',
    description: 'Event bibs and race printing',
    href: '/products?division=race-numbers',
    icon: Hash,
    color: 'bg-red-500/10',
    iconColor: 'text-red-500',
  },
  {
    name: 'Print',
    description: 'Business cards, flyers and posters',
    href: '/products?division=print',
    icon: Printer,
    color: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    name: 'MTB Boards',
    description: 'Durable race/event boards',
    href: '/products?division=mtb-boards',
    icon: Bike,
    color: 'bg-green-500/10',
    iconColor: 'text-green-500',
  },
  {
    name: 'Stamps',
    description: 'Self-inking and pre-inked stamps',
    href: '/stamps',
    icon: Stamp,
    color: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
  {
    name: 'Trophies',
    description: 'Custom awards and medals',
    href: '/products?division=trophies',
    icon: Trophy,
    color: 'bg-yellow-500/10',
    iconColor: 'text-yellow-500',
  },
  {
    name: 'Laser',
    description: 'Laser cut and engraved products',
    href: '/products?division=laser',
    icon: Zap,
    color: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
  },
]

export function ProductHub() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading text-3xl font-bold text-brand-text sm:text-4xl lg:text-5xl">
            Explore our print suite
          </h2>
          <p className="mt-4 text-lg text-brand-text-muted">
            Specialized solutions for every branding and event requirement.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((product) => (
            <Link
              key={product.name}
              href={product.href}
              className="group relative flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/20 hover:shadow-xl sm:items-start sm:text-left"
            >
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${product.color}`}>
                <product.icon className={`h-7 w-7 ${product.iconColor}`} />
              </div>
              
              <h3 className="font-heading text-xl font-bold text-brand-text">
                {product.name}
              </h3>
              
              <p className="mt-2 text-brand-text-muted">
                {product.description}
              </p>
              
              <div className="mt-8 flex items-center gap-1.5 text-sm font-bold text-brand-primary">
                View range
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
