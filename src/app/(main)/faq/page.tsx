'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: `What is ${SITE_NAME}?`,
        a: `${SITE_NAME} is a South African web-to-print platform offering custom printing solutions across five specialized divisions: labels, laser cutting, event numbers, stamps, and trophies/sleeves.`,
      },
      {
        q: 'How do I place an order?',
        a: 'Browse our product catalog, select a product, customize it using our online designer or upload your own artwork, approve your digital proof, and proceed to checkout.',
      },
      {
        q: 'Do I need design software?',
        a: 'No! Our built-in online designer lets you create professional designs right in your browser. Just choose a template, add your text and images, and you\'re ready to print.',
      },
    ],
  },
  {
    category: 'Orders & Shipping',
    questions: [
      {
        q: 'What are your turnaround times?',
        a: 'Standard orders are typically ready within 3-5 business days after proof approval. Rush options may be available depending on the product type.',
      },
      {
        q: 'Do you ship nationwide?',
        a: 'Yes, we deliver across all nine provinces of South Africa. Shipping costs are calculated based on your delivery address and order size.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes, log into your account to view your order status in real-time. You\'ll also receive email updates at each stage of production.',
      },
      {
        q: 'What is your return policy?',
        a: 'Since all products are custom-made, we cannot accept returns unless there is a manufacturing defect. Please review your digital proof carefully before approving.',
      },
    ],
  },
  {
    category: 'Design & Proofing',
    questions: [
      {
        q: 'What file formats do you accept?',
        a: 'We accept PNG, JPG, SVG, and PDF files. For best results, upload high-resolution images (300 DPI or higher).',
      },
      {
        q: 'What is a digital proof?',
        a: 'A digital proof is a preview of your finished product. You can review it online, zoom in on details, and either approve it for production or request changes.',
      },
      {
        q: 'Can I use CSV for bulk orders?',
        a: 'Yes! For event numbers, race bibs, and similar products, you can upload a CSV file with participant data and we\'ll automatically generate individual designs for each entry.',
      },
    ],
  },
  {
    category: 'Pricing & Payment',
    questions: [
      {
        q: 'How is pricing calculated?',
        a: 'Pricing depends on the product type, quantity, material, size, and any finishing options. Our real-time price calculator shows you the cost as you configure your product.',
      },
      {
        q: 'Are there quantity discounts?',
        a: 'Yes, we offer tiered pricing with discounts for larger quantities. The more you order, the lower the per-unit cost.',
      },
      {
        q: 'Is VAT included in the prices?',
        a: 'Prices displayed on our website exclude 15% VAT. VAT is calculated and shown separately during checkout.',
      },
    ],
  },
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggle = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-brand-black">Frequently Asked Questions</h1>
      <p className="mt-4 text-lg text-brand-gray-medium">
        Find answers to common questions about our products and services.
      </p>

      <div className="mt-12 space-y-10">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="text-2xl font-bold text-brand-black">{section.category}</h2>
            <div className="mt-4 divide-y divide-brand-gray-light rounded-xl border border-brand-gray-light">
              {section.questions.map((item, idx) => {
                const key = `${section.category}-${idx}`
                const isOpen = openItems.has(key)
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggle(key)}
                      className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-brand-bg"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${key}`}
                    >
                      <span className="font-medium text-brand-black">{item.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-brand-gray-medium transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div id={`faq-answer-${key}`} role="region" aria-labelledby={`faq-q-${key}`} className="px-6 pb-4 text-brand-gray-medium">{item.a}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
