'use client'

import { useState } from 'react'
import { ArrowRight, Loader2, Send, ShieldCheck, CheckCircle2, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { ArtworkUpload } from '@/components/order/ArtworkUpload'

const FINISH_OPTIONS = ['Gloss Lamination', 'Matt Lamination', 'Uncoated', 'Not Sure']
const PRODUCT_TYPES = [
  'Labels',
  'Race Numbers',
  'Event Tags',
  'MTB Boards',
  'Acrylic Signs',
  'Flyers',
  'Coffee Cup Sleeves',
  'Business Cards',
  'Stamps',
  'Laser Engraving & Cutting',
  'Trophies',
  'Print',
  'Mixed Pack',
]
const REFERRAL_SOURCES = ['Google', 'Social Media', 'Word of Mouth', 'Returning Customer', 'Other']

const PRODUCT_SIZES: Record<string, string[]> = {
  'Labels': ['Custom (max 410mm × 300mm — adhesive)', 'Custom (max 700mm wide — vinyl)'],
  'Race Numbers': ['Standard — 148mm × 210mm', 'Small — 105mm × 148mm', 'Large — 210mm × 200mm', 'Custom'],
  'Event Tags': ['150mm × 150mm', '148mm × 105mm', '85mm × 120mm', 'Custom'],
  'MTB Boards': ['Standard — 148mm × 210mm', 'Small — 105mm × 148mm', 'Large — 210mm × 200mm', 'Custom'],
  'Acrylic Signs': ['3mm', '5mm', 'Custom'],
  'Flyers': ['A4', 'A5', 'A6', 'Custom'],
  'Coffee Cup Sleeves': ['67mm × 250mm (S / M / L / XL cups)', 'Custom'],
  'Business Cards': ['50mm × 90mm'],
  'Stamps': ['Please specify in notes — we’ll send a list'],
  'Laser Engraving & Cutting': ['Keyring size (60×30mm)', 'A5 (210×148mm)', 'A4 (297×210mm)', 'A3 (420×297mm)', 'A2 (594×420mm)', 'Custom'],
  'Trophies': ['Small (up to 20cm)', 'Medium (20–35cm)', 'Large (35cm+)', 'Custom'],
  'Print': ['A6', 'A5', 'A4', 'A3', 'DL', 'Custom'],
}

const PRODUCT_MATERIALS: Record<string, string[]> = {
  'Labels': ['1-Year White Vinyl', '3-Year Grey Back Vinyl', '1-Year Clear Vinyl', 'Polylaser Adhesive', 'Paper Adhesive'],
  'Race Numbers': ['TEX21', 'Ecoflex'],
  'Event Tags': ['300gsm', 'Ecoflex Board', '0.9mm ABS'],
  'MTB Boards': ['Ecoflex Board', '0.9mm ABS'],
  'Acrylic Signs': ['Clear', 'White', 'Black', 'Custom (on request)'],
  'Flyers': ['80gsm Bond (Budget)', '130gsm Gloss'],
  'Coffee Cup Sleeves': ['250gsm (White)', 'Kraft Paper (Brown)'],
  'Business Cards': ['300gsm'],
  'Stamps': ['Self-inking'],
  'Laser Engraving & Cutting': ['Acrylic (Perspex)', 'Wood / Timber', 'Anodised Aluminium', 'Stainless Steel', 'Leather', 'Custom (on request)'],
  'Trophies': ['Glass', 'Acrylic', 'Metal', 'Timber / Wood', 'Custom (on request)'],
  'Print': ['80gsm Bond', '130gsm Gloss', '250gsm', '300gsm', 'Kraft Paper', 'Custom'],
}

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
  const [artworkFile, setArtworkFile] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      // Upload artwork file first (if provided)
      let artworkUrl: string | undefined
      if (artworkFile) {
        const fd = new FormData()
        fd.append('file', artworkFile)
        const uploadRes = await fetch('/api/quote-upload', { method: 'POST', body: fd })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          artworkUrl = uploadData.url
        }
        // Non-fatal: if upload fails, proceed without artwork URL
      }

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          artwork_url: artworkUrl,
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
            setArtworkFile(null)
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
            <select required value={form.product_type} onChange={(e) => { set('product_type', e.target.value); set('dimensions', ''); set('material', '') }} disabled={loading} className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50">
              <option value="">Select product type</option>
              {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-text">Quantity <span className="text-red-500">*</span></label>
            <input required type="number" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-text">Size or Dimensions</label>
            {form.product_type && PRODUCT_SIZES[form.product_type] ? (
              <select value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50">
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
              <select value={form.material} onChange={(e) => set('material', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50">
                <option value="">Select material</option>
                {PRODUCT_MATERIALS[form.product_type].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input type="text" placeholder="e.g. Acrylic, Timber" value={form.material} onChange={(e) => set('material', e.target.value)} disabled={loading} className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50" />
            )}
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
        <ArtworkUpload label="Upload your artwork file (optional)" onFileChange={setArtworkFile} />
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

      <div className="space-y-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {artworkFile ? 'Uploading & Sending…' : 'Sending…'}</>
          ) : (
            <>Send My Quote Request <ArrowRight className="h-4 w-4" /></>
          )}
        </button>

        {/* Reassurance points */}
        <div className="flex flex-wrap gap-4 pt-1">
          {[
            { icon: CheckCircle2, text: 'You\'ll approve a proof before we print' },
            { icon: Palette, text: 'Artwork help available from our team' },
            { icon: ShieldCheck, text: 'Local South African support' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5 text-xs text-brand-text-muted">
              <item.icon className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </form>
  )
}
