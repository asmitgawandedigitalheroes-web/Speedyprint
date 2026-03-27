import React from 'react'
import { Truck, ShieldCheck, Clock, MapPin } from 'lucide-react'

const FEATURES = [
  {
    icon: Truck,
    title: 'Free Delivery',
    description: 'On orders over R500',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Guaranteed',
    description: '100% satisfaction',
  },
  {
    icon: Clock,
    title: 'Quick Turnaround',
    description: 'Fast production times',
  },
  {
    icon: MapPin,
    title: 'SA Based',
    description: 'Proudly South African',
  },
]

export const FeatureStrip = () => {
  return (
    <section className="border-y border-gray-100 bg-white py-8 lg:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-y-8 gap-x-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center gap-3 lg:flex-row lg:text-left lg:justify-center lg:gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 shadow-sm transition-transform hover:scale-105">
                <feature.icon className="h-6 w-6 text-brand-primary" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-brand-text lg:text-base">
                  {feature.title}
                </h3>
                <p className="text-xs text-brand-text-muted">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
