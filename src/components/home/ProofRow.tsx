import { Star, Users, Clock, Leaf } from 'lucide-react'

const STATS = [
  {
    icon: Star,
    value: '4.9/5',
    label: 'Customer Rating',
    sub: '2,000+ verified reviews',
  },
  {
    icon: Users,
    value: '5,000+',
    label: 'Happy Clients',
    sub: 'Nationwide across South Africa',
  },
  {
    icon: Clock,
    value: '24hr',
    label: 'Average Turnaround',
    sub: 'Same-day dispatch available',
  },
  {
    icon: Leaf,
    value: '100%',
    label: 'SA-Based Production',
    sub: 'Proudly printed in South Africa',
  },
]

export function ProofRow() {
  return (
    <div className="border-y border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 divide-x divide-gray-100 lg:grid-cols-4">
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
