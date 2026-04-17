import Link from 'next/link'
import { RefreshCw, Palette, Package, MapPin, ArrowRight } from 'lucide-react'

const FEATURES = [
  {
    icon: RefreshCw,
    title: 'Quick Reorder',
    description: 'Reorder any previous job in 2 clicks with the exact same specs and artwork.',
    color: 'bg-violet-500/10',
    iconColor: 'text-violet-600',
  },
  {
    icon: Palette,
    title: 'Saved Designs',
    description: 'Your uploaded artwork is stored securely and ready to use on your next order.',
    color: 'bg-sky-500/10',
    iconColor: 'text-sky-600',
  },
  {
    icon: Package,
    title: 'Live Order Status',
    description: 'Track every order from payment confirmation through to delivery at your door.',
    color: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
  },
  {
    icon: MapPin,
    title: 'Saved Addresses',
    description: 'Store your delivery addresses for one-click checkout on every future order.',
    color: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
  },
]

export default function AccountConvenience() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-12 flex flex-col gap-6 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-bold text-brand-text">
              Your account. Order faster every time.
            </h2>
            <p className="mt-2 text-brand-text-muted">
              Create a free account to unlock repeat ordering, saved designs and complete order history.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/25 transition-all hover:-translate-y-0.5 hover:bg-brand-primary-dark"
            >
              Create account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-brand-text transition hover:border-brand-primary/40 hover:text-brand-primary"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Feature grid — same pattern as ProductHub */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description, color, iconColor }) => (
            <div
              key={title}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-primary/20 hover:shadow-xl"
            >
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
                <Icon className={`h-7 w-7 ${iconColor}`} />
              </div>
              <h3 className="font-heading text-lg font-bold text-brand-text">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">
                {description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
