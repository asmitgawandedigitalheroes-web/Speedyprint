'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'

const faqs = [
  {
    category: 'General',
    questions: [
      { q: `What is ${SITE_NAME}?`, a: `${SITE_NAME} is a South African web-to-print platform offering custom printing solutions across six specialised divisions: labels & stickers, race numbers & event tags, MTB boards, stamps, trophies & awards, and laser-cut & NFC products.` },
      { q: 'How do I place an order?', a: 'Browse our product catalogue, select a product, customise it using our online designer or upload your own artwork, approve your digital proof, and proceed to checkout. Need help? Call us on 011 027 1811 or chat on WhatsApp.' },
      { q: 'Do I need design software?', a: "No! Our built-in online designer lets you create professional designs right in your browser. Choose a template, add your text and images, and you're ready to print. If you'd prefer, you can also upload your own ready-to-print artwork." },
      { q: 'Who do you print for?', a: 'We work with event organisers, businesses, schools, sports clubs, non-profits, and individual customers. Whether you need 10 labels or 5 000 race boards, we can help.' },
    ],
  },
  {
    category: 'Artwork',
    questions: [
      { q: 'What file formats do you accept?', a: 'We accept PDF, AI, EPS, PNG, JPG, and SVG files. PDF and vector formats (AI, EPS, SVG) give the sharpest results. For raster files, please supply them at 300 DPI or higher at the final print size.' },
      { q: 'What resolution should my artwork be?', a: 'For raster images (PNG, JPG), supply at least 300 DPI at the final printed size. Low-resolution files may appear blurry or pixelated when printed. If you are unsure, our team will check your file before going to print.' },
      { q: 'Do I need to add bleed to my artwork?', a: 'Yes — for most products we require a minimum 3 mm bleed on all sides. Bleed is the extra area beyond your trim edge that ensures no white borders appear after cutting. Our artwork specs page has templates and guides for each product.' },
      { q: 'What colour mode should I use?', a: 'All products are printed in CMYK. If you supply RGB artwork, our team will convert it before printing — there may be minor colour differences, particularly with bright or neon colours. For accurate colour matching, supply CMYK artwork or contact us.' },
      { q: "I don't have artwork — can you still help?", a: "Yes. You can use our online designer to build your design from a template, or submit your order and request design assistance from our team. We'll follow up to collect your content and create a proof for you to approve." },
      { q: 'Where can I find artwork guides and templates?', a: 'Visit our Artwork Specs page for resolution guides, bleed templates, and accepted file format details for every product category.' },
    ],
  },
  {
    category: 'Delivery',
    questions: [
      { q: 'What are your turnaround times?', a: 'Standard orders are typically ready within 3–5 business days after proof approval. MTB boards and large event orders may take 5–7 days. Rush options may be available — contact us to discuss your deadline.' },
      { q: 'Do you deliver nationwide?', a: 'Yes, we deliver across all nine provinces of South Africa via courier. Shipping costs are calculated at checkout based on your delivery address and order size. Free delivery applies on qualifying orders.' },
      { q: 'Can I track my order?', a: "Yes — log into your account to view your order status in real time. You'll also receive email updates at each stage: payment confirmed, in production, dispatched, and delivered." },
      { q: 'What is your return policy?', a: 'Since all products are custom-made to your specification, we cannot accept returns unless there is a manufacturing defect or a production error on our side. Please review your digital proof carefully before approving — once approved, we go straight to print.' },
    ],
  },
  {
    category: 'Event printing',
    questions: [
      { q: 'Can I order race numbers and MTB boards for a cycling event?', a: 'Yes — race numbers, event tags, and MTB number boards are a core speciality. We handle small club events and large professional races. Upload your rider data via CSV for automated variable-number printing.' },
      { q: 'How does the CSV upload work for variable data?', a: "For event products like race numbers and MTB boards, upload a CSV file containing each participant's data (number, name, category, club, etc.). Our system validates the file, previews each board, and attaches it to your order for our production team." },
      { q: 'Can I order multiple products for one event in a single quote?', a: 'Yes. Use our bulk order or event quote form and list all the products you need (race numbers, event tags, MTB boards, signage, trophies). We\'ll prepare a combined quote for your event.' },
      { q: 'What is the minimum quantity for event orders?', a: 'Minimum quantities vary by product. For most event print products, the minimum is 10 units. Larger quantities attract volume discounts. Contact us for event-specific pricing.' },
    ],
  },
  {
    category: 'NFC & smart products',
    questions: [
      { q: 'What is NFC?', a: 'NFC (Near Field Communication) is a short-range wireless technology that lets a smartphone read information from a small embedded chip simply by tapping the device against it. It is the same technology used in contactless bank cards and Apple Pay. We embed NFC chips into business cards, stands, and signage so a single tap shares your contact details, website, social profiles, or any link you choose — no app required.' },
      { q: 'What can NFC products be used for?', a: 'NFC business cards share contact details with a tap; NFC stands at restaurants and venues open menus, reviews, or Wi-Fi details; product NFC tags link to instructions, warranties, or promotions; event NFC badges link to schedules or speaker bios. Anything you can put on a URL can sit behind an NFC tap.' },
      { q: 'Do NFC products need an app?', a: 'No app is needed on modern Android or iPhone devices (iPhone 7 and newer with iOS 14+). The phone reads the chip natively and opens the linked content in the browser.' },
      { q: 'Can I update what an NFC tag links to?', a: 'Yes — we configure your NFC chips to point to a short link you can edit on your dashboard. Update your landing page or destination URL at any time without reprinting the card or tag.' },
    ],
  },
  {
    category: 'Payments',
    questions: [
      { q: 'How is pricing calculated?', a: 'Pricing depends on the product type, quantity, material, size, and finishing options. Our real-time price calculator shows you the cost as you configure your product — no hidden fees.' },
      { q: 'Are there quantity discounts?', a: 'Yes. We offer tiered pricing with discounts for larger quantities. The more you order, the lower the per-unit cost. Volume pricing is shown automatically as you increase your quantity.' },
      { q: 'Is VAT included in the prices?', a: 'Prices displayed on our website exclude 15% South African VAT. VAT is calculated and shown separately during checkout before you pay.' },
      { q: 'What payment methods do you accept?', a: 'We accept card payments via Stripe, EFT and instant EFT via PayFast, and Switch. You can also request to pay later by invoice on qualifying business accounts — contact us to set this up.' },
    ],
  },
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  const toggle = (key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const trimmed = query.trim().toLowerCase()
  const isSearching = trimmed.length > 0

  const filteredFaqs = useMemo(() => {
    if (!isSearching) return faqs
    return faqs
      .map((section) => ({
        ...section,
        questions: section.questions.filter(
          (item) =>
            item.q.toLowerCase().includes(trimmed) ||
            item.a.toLowerCase().includes(trimmed) ||
            section.category.toLowerCase().includes(trimmed),
        ),
      }))
      .filter((section) => section.questions.length > 0)
  }, [trimmed, isSearching])

  const matchCount = filteredFaqs.reduce((sum, s) => sum + s.questions.length, 0)

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

          {/* Search */}
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQs — e.g. “What is NFC?”"
              aria-label="Search FAQs"
              className="w-full rounded-md border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-brand-text placeholder:text-brand-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-brand-text-muted transition hover:bg-gray-100 hover:text-brand-text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {isSearching && (
            <p className="mt-2 text-xs text-brand-text-muted">
              {matchCount === 0
                ? 'No matches — try a different word.'
                : `${matchCount} ${matchCount === 1 ? 'result' : 'results'} for “${query}”`}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {filteredFaqs.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 p-10 text-center">
            <p className="text-brand-text">No FAQs match “{query}”.</p>
            <p className="mt-2 text-sm text-brand-text-muted">
              Can&apos;t find what you&apos;re looking for?{' '}
              <a href="/contact" className="text-brand-primary underline hover:no-underline">
                Contact our team
              </a>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredFaqs.map((section) => (
              <div key={section.category}>
                <h2 className="mb-4 font-heading text-xl font-semibold text-brand-text border-b border-gray-100 pb-3">
                  {section.category}
                </h2>
                <div className="divide-y divide-gray-100">
                  {section.questions.map((item) => {
                    const key = `${section.category}-${item.q}`
                    const isOpen = openItems.has(key) || isSearching
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
        )}
      </div>
    </div>
  )
}
