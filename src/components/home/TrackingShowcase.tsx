import Link from 'next/link'
import { CheckCircle2, Truck, MapPin, ArrowRight } from 'lucide-react'

const TIMELINE = [
  { label: 'Order placed',         sub: 'Randburg, GP · 08:14',          done: true,  active: false },
  { label: 'Collected by courier', sub: 'Randburg depot · 14:22',        done: true,  active: false },
  { label: 'In transit',           sub: 'Johannesburg hub · 06:45',       done: true,  active: false },
  { label: 'Out for delivery',     sub: 'Cape Town · Estimated today',    done: false, active: true  },
]

const BULLETS = [
  { icon: CheckCircle2, text: 'Shipment booked automatically after payment'     },
  { icon: Truck,        text: 'Live courier scan events updated in real time'   },
  { icon: MapPin,       text: 'Tracking link sent directly to your email'       },
]

export default function TrackingShowcase() {
  return (
    <section className="bg-brand-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-12 border-b border-white/10 pb-6">
          <h2 className="font-heading text-3xl font-bold text-white">
            End-to-end order tracking
          </h2>
          <p className="mt-2 text-white/50">
            From payment to your front door — always know where your order is.
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">

          {/* Left — copy */}
          <div>
            <p className="text-lg leading-relaxed text-white/60">
              Once your payment clears, we automatically book your courier
              through Bob Go. You receive a live tracking link and can follow
              every scan event from our Randburg warehouse straight to your door.
            </p>

            <ul className="mt-8 space-y-4">
              {BULLETS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Icon className="h-4 w-4 text-brand-primary" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <Link
              href="/track-order"
              className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-secondary transition-all hover:-translate-y-0.5 hover:bg-gray-100"
            >
              Track an order
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right — tracking card (same card style as WHY US section) */}
          <div className="rounded-2xl border border-white/5 bg-white/5 p-8">

            {/* Card header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Order number</p>
                <p className="mt-0.5 font-mono text-sm font-bold text-white">ORD-SP2025</p>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                Out for delivery
              </span>
            </div>

            {/* Route */}
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">From</p>
                <p className="text-xs font-semibold text-white">Randburg, GP</p>
              </div>
              <div className="flex flex-1 items-center gap-1 px-2">
                <div className="h-px flex-1 border-t border-dashed border-white/20" />
                <Truck className="h-4 w-4 shrink-0 text-brand-primary" />
                <div className="h-px flex-1 border-t border-dashed border-white/20" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">To</p>
                <p className="text-xs font-semibold text-white">Cape Town, WC</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-0">
              {TIMELINE.map((step, i) => {
                const isLast = i === TIMELINE.length - 1
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      {step.done ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" strokeWidth={2} />
                      ) : (
                        <div className="h-5 w-5 shrink-0 rounded-full border-2 border-brand-primary bg-brand-primary/20" />
                      )}
                      {!isLast && (
                        <div className={`my-1 w-px flex-1 ${step.done ? 'bg-emerald-400/20' : 'bg-white/10'}`} />
                      )}
                    </div>
                    <div className={`${isLast ? 'pb-0' : 'pb-4'}`}>
                      <p className={`text-sm font-semibold ${step.active ? 'text-brand-primary' : step.done ? 'text-white' : 'text-white/30'}`}>
                        {step.label}
                      </p>
                      <p className={`text-xs ${step.active ? 'text-white/50' : step.done ? 'text-white/30' : 'text-white/20'}`}>
                        {step.sub}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs text-white/30">
                Courier tracking powered by{' '}
                <span className="font-semibold text-white/50">Bob Go</span>
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
