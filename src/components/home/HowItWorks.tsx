import { Palette, Upload, Printer, Truck } from 'lucide-react'

const STEPS = [
  {
    number: 1,
    title: 'Design',
    description: 'Create your design using our online editor or upload your own artwork.',
    icon: Palette,
  },
  {
    number: 2,
    title: 'Upload',
    description: 'Upload your artwork or use our design wizard to create the perfect sticker.',
    icon: Upload,
  },
  {
    number: 3,
    title: 'We Print',
    description: 'We print your stickers using premium materials and state-of-the-art equipment.',
    icon: Printer,
  },
  {
    number: 4,
    title: 'We Deliver',
    description: 'Fast delivery across South Africa. Free shipping on orders over R500.',
    icon: Truck,
  },
]

export function HowItWorks() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold text-brand-text">
            How It Works
          </h2>
          <p className="mt-2 text-brand-text-muted">
            Getting your custom stickers is easy — just follow these simple steps.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number} className="relative text-center">
              {/* Step number */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary text-2xl font-bold text-white">
                {step.number}
              </div>

              {/* Icon */}
              <div className="mt-4 flex justify-center">
                <step.icon className="h-8 w-8 text-brand-secondary" />
              </div>

              {/* Content */}
              <h3 className="mt-3 font-heading text-lg font-semibold text-brand-text">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-brand-text-muted">
                {step.description}
              </p>

              {/* Connector line (hidden on last item and mobile) */}
              {step.number < 4 && (
                <div className="absolute right-0 top-8 hidden h-0.5 w-[calc(100%-4rem)] translate-x-1/2 bg-brand-primary/20 lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
