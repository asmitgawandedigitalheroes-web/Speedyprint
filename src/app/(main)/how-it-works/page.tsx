import type { Metadata } from 'next'
import Link from 'next/link'
import { Layout, Upload, CheckCircle2, Truck, ArrowRight, FileText, Mail, Phone } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'

export const metadata: Metadata = {
  title: `How It Works | ${SITE_NAME}`,
  description:
    'From choosing a product to delivery at your door — how ordering from Speedy Print works in four simple steps.',
}

const STEPS = [
  {
    number: '01',
    title: 'Choose your product',
    icon: Layout,
    summary: 'Select from our wide range of labels, stamps, trophies, race numbers, MTB boards, or laser products.',
    detail: [
      'Browse by division — Labels, Race Numbers, MTB Boards, Laser, Stamps, or Trophies.',
      'Each product page shows sizes, materials, finishes, and real-time pricing.',
      'Not sure what you need? Use our "Get an Instant Quote" form or contact our team directly.',
    ],
    cta: { label: 'Browse all products', href: '/products' },
  },
  {
    number: '02',
    title: 'Upload artwork or design online',
    icon: Upload,
    summary: 'Use our free online design tool to create your artwork, or upload your own print-ready file.',
    detail: [
      'Our web-to-print design wizard works in your browser — no software needed. Choose from templates or start from scratch.',
      'Uploading your own file? We accept PDF, AI, EPS, PNG, JPG, and SVG. See our artwork specifications for requirements.',
      'For race numbers or MTB boards, upload a CSV file with athlete data and we\'ll handle the variable data printing.',
      'Don\'t have artwork yet? Submit your order and our team will follow up to assist.',
    ],
    cta: { label: 'See artwork specifications', href: '/artwork-specs' },
  },
  {
    number: '03',
    title: 'Approve your digital proof',
    icon: CheckCircle2,
    summary: 'Review a digital proof before we go to press. You approve it, then we print.',
    detail: [
      'For all custom products, we produce a digital proof showing exactly how your item will look before printing.',
      'You\'ll receive an email notification when your proof is ready to review.',
      'Log in to your account and view the proof — approve it with one click or request changes with written notes.',
      'Once you approve, your order enters production. No changes can be made after approval, so review carefully.',
    ],
    cta: { label: 'Create an account', href: '/register' },
  },
  {
    number: '04',
    title: 'Delivery or collection',
    icon: Truck,
    summary: 'We deliver nationwide via courier, or you can collect from our Randburg facility.',
    detail: [
      'Standard delivery: 3–5 business days after production, via our trusted courier partners.',
      'Express delivery available for most label products: 24–48 hours after approval.',
      'Free delivery on orders over R500. Flat rate R85 for smaller orders.',
      'Collection available from 13 Langwa Street, Strydompark, Randburg, 2169. Orders placed before 10am can be ready same day.',
      'You\'ll receive a tracking number via email as soon as your order is dispatched.',
    ],
    cta: { label: 'See delivery information', href: '/delivery-info' },
  },
]

export default function HowItWorksPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-white">How it works</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            From concept to delivery in four simple steps. Here&apos;s exactly what happens when you place an order with Speedy Print.
          </p>
          <div className="mt-8">
            <Link
              href="/order-now"
              className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
            >
              Get an Instant Quote <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-0">
        {STEPS.map((step, i) => (
          <div key={step.number} className="relative">
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className="absolute left-7 top-20 h-full w-px bg-brand-primary/15 lg:left-8" />
            )}

            <div className="relative flex gap-6 pb-14">
              {/* Step number / icon */}
              <div className="shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand-primary bg-white shadow-sm lg:h-16 lg:w-16">
                  <step.icon className="h-6 w-6 text-brand-primary lg:h-7 lg:w-7" />
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-2">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Step {step.number}</span>
                </div>
                <h2 className="font-heading text-2xl font-bold text-brand-text">{step.title}</h2>
                <p className="mt-2 text-base text-brand-text-muted">{step.summary}</p>

                <ul className="mt-4 space-y-2">
                  {step.detail.map((point, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-brand-text-muted">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary/60" />
                      {point}
                    </li>
                  ))}
                </ul>

                <Link
                  href={step.cta.href}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary underline underline-offset-2 hover:no-underline"
                >
                  {step.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ shortcuts */}
      <section className="bg-brand-bg py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-brand-text mb-6">Common questions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: FileText, q: 'What file formats do you accept?', href: '/artwork-specs' },
              { icon: Truck, q: 'How long does delivery take?', href: '/delivery-info' },
              { icon: Mail, q: 'Can I get a proof before printing?', href: '/faq' },
            ].map((item) => (
              <Link
                key={item.q}
                href={item.href}
                className="flex items-start gap-3 rounded-md border border-gray-100 bg-white p-5 transition hover:border-brand-primary"
              >
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                <span className="text-sm font-medium text-brand-text">{item.q} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-secondary py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-white">Ready to place your first order?</h2>
          <p className="mt-3 text-white/60">Get an instant quote in under 60 seconds.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/order-now"
              className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
            >
              Get an Instant Quote <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4" /> Call us: 011 027 1811
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
