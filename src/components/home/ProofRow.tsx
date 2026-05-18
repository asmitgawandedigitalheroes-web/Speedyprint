import { MapPin, Truck, Zap } from 'lucide-react'

const STATS = [
  {
    icon: MapPin,
    value: '100%',
    label: 'SA Production',
    sub: 'Proudly made in South Africa',
  },
  {
    icon: Truck,
    value: 'Free delivery',
    label: 'On orders over R500',
    sub: 'Nationwide door-to-door',
  },
  {
    icon: Zap,
    value: 'Same-day dispatch',
    label: 'Labels before 10am',
    sub: 'Express turnaround available',
  },
]

export function ProofRow() {
  return (
    <div className="border-y border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 divide-x divide-gray-100 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
                <stat.icon className="h-5 w-5 text-brand-primary" />
              </div>
              <p className="text-2xl font-bold text-brand-text lg:text-3xl">{stat.value}</p>
              <p className="text-sm font-semibold text-brand-text">{stat.label}</p>
              <p className="hidden text-xs text-brand-text-muted lg:block">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
