'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    q: 'How do I place an order?',
    a: 'Use the Order Now page to configure your size, material, quantity, and finish — you get an instant price. Add to cart and checkout. No account is needed for a quote, but you will need one to complete payment and track your order.',
  },
  {
    q: 'What are your turnaround times?',
    a: 'Standard turnaround is 24 hours from artwork approval. Same-day dispatch is available for simple orders placed before 10am. Custom fabrication (laser-cut, engraved, 3D domed) may take 2 to 3 business days.',
  },
  {
    q: 'What file formats do you accept?',
    a: 'We accept PDF, PNG, and SVG files. For best results, submit vector artwork at 300 dpi with 3mm bleed included. Our designer tool can help you set this up when working from a logo.',
  },
  {
    q: 'How is pricing calculated?',
    a: 'Price is based on size, material, finish, and quantity. Volume discounts kick in at 50, 100, 250, and 1,000 units. All prices include VAT. Use the Order Now page for an instant quote with no obligation.',
  },
  {
    q: 'Do you offer discounts for bulk or repeat orders?',
    a: 'Yes. Volume pricing is applied automatically — order 50+ units and the per-unit price drops immediately. For large runs, fleet decals, or variable-data jobs such as numbered race bibs via CSV, contact us directly for a custom quote.',
  },
  {
    q: 'Are your stickers waterproof?',
    a: 'Yes. Our white, clear, and metallic vinyl options are 100% waterproof and UV-resistant, making them perfect for outdoor use, vehicles, and food packaging that requires refrigeration.',
  },
  {
    q: 'What materials do you use?',
    a: 'We offer a wide range of premium materials including high-tack white vinyl, clear/transparent vinyl, chrome/metallic finishes, and specialty 3D domed resin for a premium tactile feel.',
  },
  {
    q: 'Is there a minimum order quantity?',
    a: 'We support everyone from small makers to large brands. While there is no strict minimum, our volume discounts significantly reduce the per-unit price for orders of 50 units or more.',
  },
]

export function HomeFAQ() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-primary">
            Common questions
          </p>
          <h2 className="font-heading text-3xl font-bold text-brand-text lg:text-4xl">
            Everything you need to know
          </h2>
          <p className="mt-3 text-brand-text-muted">
            Quick answers to the questions we hear most from new customers.
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="multiple" className="divide-y divide-gray-100">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-none">
              <AccordionTrigger className="py-4 text-left text-sm font-semibold text-brand-text no-underline hover:text-brand-primary hover:no-underline [&>svg]:text-brand-primary">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-brand-text-muted">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Link to full FAQ */}
        <div className="mt-8 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-primary-dark transition-colors"
          >
            See all FAQs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
