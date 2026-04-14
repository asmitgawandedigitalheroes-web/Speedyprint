'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Star, StarOff, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  PageHeader, SectionCard, EmptyState, StatusBadge, SkeletonRows, ActionBtn,
} from '@/components/admin/AdminUI'
import type { Testimonial } from '@/types'

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  )
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form fields
  const [customerName, setCustomerName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [location, setLocation] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [featured, setFeatured] = useState(false)

  useEffect(() => { fetchTestimonials() }, [])

  async function fetchTestimonials() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/testimonials')
      const data = await res.json()
      setTestimonials(data.testimonials || [])
    } catch {
      toast.error('Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setCustomerName(''); setCompanyName(''); setLocation('')
    setRating(5); setReviewText(''); setFeatured(false)
    setEditing(null); setFormError(null)
  }

  function openCreate() { resetForm(); setDialogOpen(true) }

  function openEdit(t: Testimonial) {
    setEditing(t)
    setCustomerName(t.customer_name); setCompanyName(t.company_name || '')
    setLocation(t.location || ''); setRating(t.rating)
    setReviewText(t.review_text); setFeatured(t.featured)
    setFormError(null); setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !reviewText) { setFormError('Customer name and review text are required'); return }
    setSaving(true); setFormError(null)
    try {
      const payload = { customer_name: customerName, company_name: companyName || null, location: location || null, rating, review_text: reviewText, featured }
      const res = editing
        ? await fetch(`/api/admin/testimonials/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/admin/testimonials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      toast.success(editing ? 'Testimonial updated' : 'Testimonial added')
      setDialogOpen(false); resetForm(); fetchTestimonials()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTestimonials((prev) => prev.filter((t) => t.id !== id))
      toast.success('Testimonial deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleFeatured = async (t: Testimonial) => {
    setToggling(t.id)
    try {
      const res = await fetch(`/api/admin/testimonials/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !t.featured }),
      })
      if (!res.ok) throw new Error()
      setTestimonials((prev) => prev.map((item) => item.id === t.id ? { ...item, featured: !item.featured } : item))
    } catch {
      toast.error('Failed to update')
    } finally {
      setToggling(null)
    }
  }

  const featuredCount = testimonials.filter(t => t.featured).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testimonials"
        description="Manage customer reviews displayed on your website"
        actions={
          <div className="flex items-center gap-2">
            {!loading && featuredCount > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{featuredCount} featured</span>
            )}
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Testimonial
            </button>
          </div>
        }
      />

      <SectionCard noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Customer</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Rating</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">Review</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Featured</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={5} cols={5} />
              ) : testimonials.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={MessageSquare}
                      title="No testimonials yet"
                      description="Add your first customer review to build trust with visitors"
                      action={
                        <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark transition-all shadow-sm">
                          <Plus className="h-4 w-4" /> Add Testimonial
                        </button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                testimonials.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{t.customer_name}</p>
                      <p className="text-[11px] text-gray-400">
                        {[t.company_name, t.location].filter(Boolean).join(', ') || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StarRating rating={t.rating} />
                    </td>
                    <td className="hidden px-5 py-3.5 md:table-cell">
                      <p className="max-w-xs text-xs text-gray-500 line-clamp-2">{t.review_text}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge label={t.featured ? 'Featured' : 'Hidden'} color={t.featured ? 'green' : 'gray'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <ActionBtn
                          onClick={() => handleToggleFeatured(t)}
                          icon={t.featured ? StarOff : Star}
                          label={t.featured ? 'Unfeature' : 'Feature'}
                          disabled={toggling === t.id}
                        />
                        <ActionBtn onClick={() => openEdit(t)} icon={Pencil} label="Edit" />
                        <ActionBtn onClick={() => handleDelete(t.id)} icon={Trash2} label="Delete" danger disabled={deleting === t.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Customer Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., John Doe"
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Company</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Cape Town"
                  className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </div>
            </div>

            {/* Star rating picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Rating *</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className="p-0.5">
                    <Star className={`h-6 w-6 transition-colors ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Review *</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did the customer say?"
                rows={4}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 resize-none"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Featured on homepage</span>
            </label>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-brand-primary py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark transition-all shadow-sm disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Testimonial'}
              </button>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
