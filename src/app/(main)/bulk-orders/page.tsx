'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Upload, Users, Clock, CheckCircle2, Package, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

// TODO: Replace with real client case studies before launch
const SOCIAL_PROOF = [
  { event: 'Highveld MTB Classic', quote: 'Boards arrived 2 days before the race, exactly as designed. Will order again.', organiser: 'Race Director' },
  { event: 'Gauteng Trail Run Series', quote: 'Smooth CSV upload process — 450 bibs all unique, zero errors. Impressive turnaround.', organiser: 'Event Coordinator' },
  { event: 'Corporate Awards Evening 2024', quote: 'Trophies engraved perfectly. They loved the quality.', organiser: 'HR Manager' },
]

const MIN_QUANTITIES = [
  { product: 'Labels & Stickers', min: '500+ units' },
  { product: 'Race Numbers', min: '100+ bibs' },
  { product: 'MTB Boards', min: '50+ boards' },
  { product: 'Stamps', min: '10+ units' },
  { product: 'Trophies & Awards', min: '20+ items' },
  { product: 'Laser Engraving', min: '25+ items' },
]

const LEAD_TIMES = [
  { product: 'Labels', standard: '3–5 working days', express: '24–48 hours', capacity: 'Up to 50,000 units/week' },
  { product: 'Race Numbers', standard: '5–7 working days', express: 'Contact us', capacity: 'Up to 2,000 bibs/week' },
  { product: 'MTB Boards', standard: '5–7 working days', express: 'Contact us', capacity: 'Up to 500 boards/week' },
  { product: 'Laser Engraving', standard: '3–5 working days', express: '—', capacity: 'Up to 200 items/week' },
  { product: 'Stamps', standard: '2–3 working days', express: '—', capacity: 'Up to 100 units/week' },
  { product: 'Trophies', standard: '7–10 working days', express: '—', capacity: 'Up to 100 items/week' },
]

const FINISH_OPTIONS = ['Gloss', 'Matte', 'Uncoated', 'Not Sure']
const PRODUCT_TYPES = ['Labels', 'Race Numbers', 'MTB Boards', 'Laser Engraving', 'Stamps', 'Trophies', 'Mixed Pack']
const REFERRAL_SOURCES = ['Google', 'Social Media', 'Word of Mouth', 'Returning Customer', 'Other']

const PRODUCT_SIZES: Record<string, string[]> = {
  'Labels': ['25×25mm', '50×50mm', '100×100mm', '100×50mm', '200×100mm', '200×150mm', 'Custom'],
  'Race Numbers': ['210×150mm', '210×148mm (A5)', '200×200mm', '250×200mm', 'Custom'],
  'MTB Boards': ['300×200mm', '400×300mm', '500×400mm', 'Custom'],
  'Laser Engraving': ['50×25mm', '100×50mm', '150×100mm', '200×150mm', 'Custom'],
  'Stamps': ['30×30mm', '40×40mm', '50×50mm', '70×40mm', 'Custom'],
  'Trophies': ['Small (up to 20cm)', 'Medium (20–35cm)', 'Large (35cm+)'],
}

const PRODUCT_MATERIALS: Record<string, string[]> = {
  'Labels': ['White Vinyl', 'Clear Vinyl', 'Silver Vinyl', 'Gloss Paper', 'Kraft Paper'],
  'Race Numbers': ['Ecoflex', 'TEX21', 'Waterproof Synthetic'],
  'MTB Boards': ['Corrugated Plastic', 'Foamboard', 'Aluminium Composite'],
  'Laser Engraving': ['Acrylic', 'Wood', 'Anodised Aluminium', 'Leather'],
  'Stamps': ['Pre-inked', 'Self-inking', 'Rubber'],
  'Trophies': ['Resin', 'Crystal', 'Metal', 'Wood'],
}

export default function BulkOrdersPage() {
  const [form, setForm] = useState({
    full_name: '',
    company: '',
    email: '',
    phone: '',
    event_name: '',
    event_date: '',
    delivery_date: '',
    product_type: '',
    quantity: '',
    dimensions: '',
    material: '',
    finish: '',
    special_instructions: '',
    referral: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.full_name,
          email: form.email,
          subject: `Bulk Order Quote Request — ${form.product_type || 'General'} — ${form.event_name || 'No event name'}`,
          message: `
Company: ${form.company || '—'}
Phone: ${form.phone}
Event/Project: ${form.event_name || '—'}
Event Date: ${form.event_date || '—'}
Required Delivery: ${form.delivery_date}
Product Type: ${form.product_type}
Quantity: ${form.quantity}
Dimensions: ${form.dimensions || '—'}
Material: ${form.material || '—'}
Finish: ${form.finish || '—'}
Special Instructions: ${form.special_instructions || '—'}
How they heard about us: ${form.referral || '—'}
          `.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not send your request. Please try again.')
        return
      }
      setSubmitted(true)
    } catch {
      toast.error('Could not send your request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-brand-secondary">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-brand-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Bulk Orders</span>
            </div>
            <h1 className="font-heading text-4xl font-bold text-white lg:text-5xl">
              Running an event? We handle the full print pack.
            </h1>
            <p className="mt-4 text-lg text-white/70">
              From race numbers to medals — one supplier, one deadline, zero stress.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#quote-form"
                className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                Request a Bulk Quote <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* What qualifies */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-text">What qualifies as a bulk order?</h2>
            <p className="mt-2 text-brand-text-muted">Orders that meet these minimum quantities are eligible for bulk pricing and priority scheduling.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {MIN_QUANTITIES.map((item) => (
              <div key={item.product} className="rounded-md border border-gray-100 bg-brand-bg p-5 text-center">
                <p className="font-heading text-xl font-bold text-brand-primary">{item.min}</p>
                <p className="mt-1 text-xs font-medium text-brand-text">{item.product}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-brand-text-muted">
            Orders below these quantities are welcome at standard pricing. <Link href="/products" className="text-brand-primary underline underline-offset-2">Browse all products →</Link>
          </p>
        </div>
      </section>

      {/* CSV Variable Data */}
      <section className="bg-brand-bg py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-text">Variable data & CSV upload</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <p className="text-brand-text-muted leading-relaxed">
                For race numbers and MTB boards, each unit needs unique data — rider names, numbers, categories. Instead of designing each one manually, simply supply a CSV file and our system handles the rest.
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Upload className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold text-brand-text">Race Numbers CSV columns</p>
                    <p className="text-xs text-brand-text-muted font-mono mt-1">race_number, athlete_name, category, team, club</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Upload className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                  <div>
                    <p className="text-sm font-semibold text-brand-text">MTB Boards CSV columns</p>
                    <p className="text-xs text-brand-text-muted font-mono mt-1">board_number, athlete_name, category, club</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-gray-100 bg-white p-6">
              <h3 className="font-heading font-semibold text-brand-text mb-4">CSV template downloads</h3>
              <div className="space-y-3">
                {/* TODO: Replace with real CSV template files from client */}
                <a
                  href="/templates/race_numbers_template.csv"
                  download
                  className="flex items-center justify-between rounded-md border border-gray-100 bg-brand-bg p-3 transition hover:border-brand-primary"
                >
                  <div>
                    <p className="text-sm font-medium text-brand-text">Race Numbers template</p>
                    <p className="text-xs text-brand-text-muted">.csv — includes column headers</p>
                  </div>
                  <span className="rounded bg-brand-primary px-2 py-1 text-xs font-semibold text-white">Download</span>
                </a>
                <a
                  href="/templates/mtb_boards_template.csv"
                  download
                  className="flex items-center justify-between rounded-md border border-gray-100 bg-brand-bg p-3 transition hover:border-brand-primary"
                >
                  <div>
                    <p className="text-sm font-medium text-brand-text">MTB Boards template</p>
                    <p className="text-xs text-brand-text-muted">.csv — includes column headers</p>
                  </div>
                  <span className="rounded bg-brand-primary px-2 py-1 text-xs font-semibold text-white">Download</span>
                </a>
              </div>
              <p className="mt-4 text-xs text-brand-text-muted">You can also upload CSV data directly on the Race Numbers and MTB Boards product pages.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Turnaround & Capacity */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-text">Turnaround & capacity</h2>
            <p className="mt-2 text-brand-text-muted">Lead times are indicative — confirm at time of order. <Link href="/contact" className="text-brand-primary underline underline-offset-2">Contact us</Link> for urgent deadlines.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 text-left font-semibold text-brand-text">Product</th>
                  <th className="py-3 text-left font-semibold text-brand-text">Standard lead time</th>
                  <th className="py-3 text-left font-semibold text-brand-text">Express</th>
                  <th className="py-3 text-left font-semibold text-brand-text">Max weekly capacity</th>
                </tr>
              </thead>
              <tbody>
                {LEAD_TIMES.map((row, i) => (
                  <tr key={row.product} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-brand-bg/50'}`}>
                    <td className="py-3 font-medium text-brand-text">{row.product}</td>
                    <td className="py-3 text-brand-text-muted">{row.standard}</td>
                    <td className="py-3 text-brand-text-muted">{row.express}</td>
                    <td className="py-3 text-brand-text-muted">{row.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-brand-text-muted">
            Note: Contact us for urgent deadlines — we&apos;ll do our best.
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-brand-bg py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-text">Trusted by race organisers across South Africa</h2>
          </div>
          {/* TODO: Replace with real client case studies before launch */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {SOCIAL_PROOF.map((item) => (
              <div key={item.event} className="rounded-md border border-gray-100 bg-white p-6">
                <div className="mb-4 h-12 w-24 rounded bg-gray-100" /> {/* Logo placeholder */}
                <p className="text-sm italic text-brand-text-muted">&ldquo;{item.quote}&rdquo;</p>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-brand-text">{item.event}</p>
                  <p className="text-xs text-brand-text-muted">{item.organiser}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote-form" className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 border-b border-gray-200 pb-6">
            <h2 className="font-heading text-2xl font-bold text-brand-text">Request a bulk quote</h2>
            <p className="mt-2 text-brand-text-muted">Fill in the form below and we&apos;ll get back to you with a tailored quote.</p>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <Clock className="h-4 w-4 shrink-0 text-blue-600" />
              <span>We typically respond within <strong>4 office hours</strong> (Mon–Fri, 08:00–16:30 SAST).</span>
            </div>
          </div>

          {submitted ? (
            <div className="rounded-md border border-green-200 bg-green-50 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-green-100">
                <Send className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 font-heading text-xl font-bold text-brand-text">Quote request received!</h3>
              <p className="mt-2 text-brand-text-muted">Thanks! We&apos;ll have a quote back to you within 1 business day.</p>
              <button
                onClick={() => { setSubmitted(false); setForm({ full_name: '', company: '', email: '', phone: '', event_name: '', event_date: '', delivery_date: '', product_type: '', quantity: '', dimensions: '', material: '', finish: '', special_instructions: '', referral: '' }) }}
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 rounded-md border border-gray-100 p-8">
              {/* Contact Details */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-text-muted">Contact details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Full Name <span className="text-red-500">*</span></label>
                    <input required type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Company / Organisation</label>
                    <input type="text" value={form.company} onChange={(e) => set('company', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Email Address <span className="text-red-500">*</span></label>
                    <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Phone Number <span className="text-red-500">*</span></label>
                    <input required type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
                  </div>
                </div>
              </div>

              {/* Event / Project Details */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-text-muted">Event / project details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Event or Project Name <span className="text-red-500">*</span></label>
                    <input required type="text" value={form.event_name} onChange={(e) => set('event_name', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Event Date</label>
                    <input type="date" value={form.event_date} onChange={(e) => set('event_date', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Required Delivery Date <span className="text-red-500">*</span></label>
                    <input required type="date" value={form.delivery_date} onChange={(e) => set('delivery_date', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
                  </div>
                </div>
              </div>

              {/* Product Specification */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-text-muted">Product specification</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Product Type <span className="text-red-500">*</span></label>
                    <select required value={form.product_type} onChange={(e) => { set('product_type', e.target.value); set('dimensions', ''); set('material', '') }} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50 bg-white">
                      <option value="">Select product type</option>
                      {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Quantity <span className="text-red-500">*</span></label>
                    <input required type="number" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Sizes or Dimensions</label>
                    {form.product_type && PRODUCT_SIZES[form.product_type] ? (
                      <select value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50 bg-white">
                        <option value="">Select size</option>
                        {PRODUCT_SIZES[form.product_type].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type="text" placeholder="e.g. 200×150mm" value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Material Preference</label>
                    {form.product_type && PRODUCT_MATERIALS[form.product_type] ? (
                      <select value={form.material} onChange={(e) => set('material', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50 bg-white">
                        <option value="">Select material</option>
                        {PRODUCT_MATERIALS[form.product_type].map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ) : (
                      <input type="text" placeholder="e.g. White vinyl, Acrylic" value={form.material} onChange={(e) => set('material', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Finish</label>
                    <select value={form.finish} onChange={(e) => set('finish', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50 bg-white">
                      <option value="">Select finish (optional)</option>
                      {FINISH_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-text-muted">Additional information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">Special Instructions</label>
                    <textarea rows={4} value={form.special_instructions} onChange={(e) => set('special_instructions', e.target.value)} disabled={loading} placeholder="Any special requirements, artwork notes, or questions..." className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
                    <p className="mt-1 text-xs text-brand-text-muted">Don&apos;t have artwork yet? Submit the form and we&apos;ll follow up to collect your files.</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-text">How did you hear about us?</label>
                    <select value={form.referral} onChange={(e) => set('referral', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50 bg-white">
                      <option value="">Select an option</option>
                      {REFERRAL_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                ) : (
                  <>Send My Quote Request <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
