import { Palette, Upload, Printer, Truck } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    title: 'Design',
    description: 'Use our online editor or upload your own print-ready artwork.',
    icon: Palette,
  },
  {
    number: '02',
    title: 'Configure',
    description: 'Choose material, size, quantity, and finish. Get an instant price.',
    icon: Upload,
  },
  {
    number: '03',
    title: 'We print',
    description: 'Premium materials, precision cutting, and rigorous quality checks.',
    icon: Printer,
  },
  {
    number: '04',
    title: 'We deliver',
    description: 'Fast courier delivery across South Africa. Free shipping over R500.',
    icon: Truck,
  },
]

export function HowItWorks() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header with ruled border */}
        <div className="mb-12 border-b border-gray-200 pb-6">
          <h2 className="font-heading text-3xl font-bold text-brand-text capitalize">
            How it works
          </h2>
          <p className="mt-2 text-brand-text-muted">
            From concept to delivery in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col gap-4">
              {/* Ghost step number */}
              <span className="font-heading text-6xl font-bold leading-none text-brand-primary/15 select-none">
                {step.number}
              </span>

              {/* Icon + label row */}
              <div className="flex items-center gap-2">
                <step.icon className="h-5 w-5 text-brand-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">
                  Step {step.number}
                </span>
              </div>

              {/* Title + body */}
              <div>
                <h3 className="font-heading text-lg font-semibold text-brand-text capitalize">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-brand-text-muted">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
