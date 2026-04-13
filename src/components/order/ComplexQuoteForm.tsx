'use client'

import { useState } from 'react'
import { ArrowRight, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { ArtworkUpload } from '@/components/order/ArtworkUpload'

const FINISH_OPTIONS = ['Gloss', 'Matte', 'Uncoated', 'Not Sure']
const PRODUCT_TYPES = ['Labels', 'Race Numbers', 'MTB Boards', 'Laser Engraving', 'Stamps', 'Trophies', 'Mixed Pack']
const REFERRAL_SOURCES = ['Google', 'Social Media', 'Word of Mouth', 'Returning Customer', 'Other']

interface ComplexQuoteFormProps {
  /** Pre-select a product type in the dropdown */
  defaultProductType?: string
}

export function ComplexQuoteForm({ defaultProductType }: ComplexQuoteFormProps) {
  const [form, setForm] = useState({
    full_name: '',
    company: '',
    email: '',
    phone: '',
    event_name: '',
    event_date: '',
    delivery_date: '',
    product_type: defaultProductType ?? '',
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
          subject: `Quote Request — ${form.product_type || 'General'} — ${form.event_name || 'No event name'}`,
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

  if (submitted) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-green-100">
          <Send className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="mt-4 font-heading text-xl font-bold text-brand-text">Quote request received!</h3>
        <p className="mt-2 text-brand-text-muted">Thanks! We&apos;ll have a quote back to you within 1 business day.</p>
        <button
          onClick={() => {
            setSubmitted(false)
            setForm({ full_name: '', company: '', email: '', phone: '', event_name: '', event_date: '', delivery_date: '', product_type: defaultProductType ?? '', quantity: '', dimensions: '', material: '', finish: '', special_instructions: '', referral: '' })
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          Submit another request
        </button>
      </div>
    )
  }

  return (
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
            <select required value={form.product_type} onChange={(e) => set('product_type', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50">
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
            <input type="text" placeholder="e.g. 200×150mm" value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-text">Material Preference</label>
            <input type="text" placeholder="e.g. Glass, Acrylic, Timber" value={form.material} onChange={(e) => set('material', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-brand-text">Finish</label>
            <select value={form.finish} onChange={(e) => set('finish', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50">
              <option value="">Select finish (optional)</option>
              {FINISH_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Artwork Upload */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-text-muted">Artwork</h3>
        <ArtworkUpload label="Upload your artwork file (optional)" />
      </div>

      {/* Additional */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-text-muted">Additional information</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-text">Special Instructions</label>
            <textarea rows={4} value={form.special_instructions} onChange={(e) => set('special_instructions', e.target.value)} disabled={loading} placeholder="Any special requirements, artwork notes, or questions…" className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
            <p className="mt-1 text-xs text-brand-text-muted">Don&apos;t have artwork yet? Submit the form and we&apos;ll follow up to collect your files.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-text">How did you hear about us?</label>
            <select value={form.referral} onChange={(e) => set('referral', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50">
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
  )
}
