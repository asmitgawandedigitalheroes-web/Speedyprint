'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'

const faqs = [
  {
    category: 'General',
    questions: [
      { q: `What is ${SITE_NAME}?`, a: `${SITE_NAME} is a South African web-to-print platform offering custom printing solutions across five specialized divisions: labels, laser cutting, event numbers, stamps, and trophies/sleeves.` },
      { q: 'How do I place an order?', a: 'Browse our product catalog, select a product, customize it using our online designer or upload your own artwork, approve your digital proof, and proceed to checkout.' },
      { q: 'Do I need design software?', a: "No! Our built-in online designer lets you create professional designs right in your browser. Just choose a template, add your text and images, and you're ready to print." },
    ],
  },
  {
    category: 'Orders & shipping',
    questions: [
      { q: 'What are your turnaround times?', a: 'Standard orders are typically ready within 3-5 business days after proof approval. Rush options may be available depending on the product type.' },
      { q: 'Do you ship nationwide?', a: 'Yes, we deliver across all nine provinces of South Africa. Shipping costs are calculated based on your delivery address and order size.' },
      { q: 'Can I track my order?', a: "Yes, log into your account to view your order status in real-time. You'll also receive email updates at each stage of production." },
      { q: 'What is your return policy?', a: 'Since all products are custom-made, we cannot accept returns unless there is a manufacturing defect. Please review your digital proof carefully before approving.' },
    ],
  },
  {
    category: 'Design & proofing',
    questions: [
      { q: 'What file formats do you accept?', a: 'We accept PNG, JPG, SVG, and PDF files. For best results, upload high-resolution images (300 DPI or higher).' },
      { q: 'What is a digital proof?', a: 'A digital proof is a preview of your finished product. You can review it online, zoom in on details, and either approve it for production or request changes.' },
      { q: 'Can I use CSV for bulk orders?', a: "Yes! For event numbers, race bibs, and similar products, you can upload a CSV file with participant data and we'll automatically generate individual designs for each entry." },
    ],
  },
  {
    category: 'Pricing & payment',
    questions: [
      { q: 'How is pricing calculated?', a: 'Pricing depends on the product type, quantity, material, size, and any finishing options. Our real-time price calculator shows you the cost as you configure your product.' },
      { q: 'Are there quantity discounts?', a: 'Yes, we offer tiered pricing with discounts for larger quantities. The more you order, the lower the per-unit cost.' },
      { q: 'Is VAT included in the prices?', a: 'Prices displayed on our website exclude 15% VAT. VAT is calculated and shown separately during checkout.' },
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
    <div className="bg-white">
      {/* Page header */}
      <div className="border-b border-gray-100 bg-brand-bg">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-brand-text">Frequently asked questions</h1>
          <p className="mt-2 text-brand-text-muted">
            Find answers to common questions about our products and services.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="mb-4 font-heading text-xl font-semibold text-brand-text border-b border-gray-100 pb-3">
                {section.category}
              </h2>
              <div className="divide-y divide-gray-100">
                {section.questions.map((item, idx) => {
                  const key = `${section.category}-${idx}`
                  const isOpen = openItems.has(key)
                  return (
                    <div key={key}>
                      <button
                        onClick={() => toggle(key)}
                        className="flex w-full items-center justify-between py-4 text-left transition hover:text-brand-primary"
                        aria-expanded={isOpen}
                      >
                        <span className="font-medium text-brand-text">{item.q}</span>
                        <ChevronDown
                          className={`ml-4 h-4 w-4 shrink-0 text-brand-text-muted transition-transform ${isOpen ? 'rotate-180 text-brand-primary' : ''}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="pb-4 text-sm leading-relaxed text-brand-text-muted">{item.a}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
