import { Truck, Shield, Clock, MapPin } from 'lucide-react'

const BADGES = [
  {
    icon: Truck,
    title: 'Free Delivery',
    subtitle: 'On orders over R500',
  },
  {
    icon: Shield,
    title: 'Quality Guaranteed',
    subtitle: '100% satisfaction',
  },
  {
    icon: Clock,
    title: 'Quick Turnaround',
    subtitle: 'Fast production times',
  },
  {
    icon: MapPin,
    title: 'SA Based',
    subtitle: 'Proudly South African',
  },
]

export function TrustBadgesBar() {
  return (
    <div className="border-y border-gray-200 bg-brand-bg">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-8">
          {BADGES.map((badge) => (
            <div
              key={badge.title}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
                <badge.icon className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-text">
                  {badge.title}
                </p>
                <p className="text-xs text-brand-text-muted">
                  {badge.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
