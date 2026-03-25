'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Star, StarOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Testimonial } from '@/types'

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [location, setLocation] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [featured, setFeatured] = useState(false)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  async function fetchTestimonials() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/testimonials')
      const data = await res.json()
      setTestimonials(data.testimonials || [])
    } catch (err) {
      console.error('Testimonials fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCustomerName('')
    setCompanyName('')
    setLocation('')
    setRating(5)
    setReviewText('')
    setFeatured(false)
    setEditing(null)
    setError(null)
  }

  const openCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (t: Testimonial) => {
    setEditing(t)
    setCustomerName(t.customer_name)
    setCompanyName(t.company_name || '')
    setLocation(t.location || '')
    setRating(t.rating)
    setReviewText(t.review_text)
    setFeatured(t.featured)
    setError(null)
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !reviewText) {
      setError('Customer name and review text are required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = {
        customer_name: customerName,
        company_name: companyName || null,
        location: location || null,
        rating,
        review_text: reviewText,
        featured,
      }

      let res: Response
      if (editing) {
        res = await fetch(`/api/admin/testimonials/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save testimonial')
      }

      setDialogOpen(false)
      resetForm()
      fetchTestimonials()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save testimonial'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      setTestimonials((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete testimonial.')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleFeatured = async (t: Testimonial) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !t.featured }),
      })
      if (!res.ok) throw new Error('Update failed')
      setTestimonials((prev) =>
        prev.map((item) =>
          item.id === t.id ? { ...item, featured: !item.featured } : item
        )
      )
    } catch (err) {
      console.error('Toggle featured error:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Testimonials</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer testimonials and reviews
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Edit Testimonial' : 'Add Testimonial'}
              </DialogTitle>
            </DialogHeader>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g., John Doe"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Cape Town"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating *</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? 'fill-brand-primary text-brand-primary'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewText">Review *</Label>
                <textarea
                  id="reviewText"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What did the customer say?"
                  rows={4}
                  required
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="featured"
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured on homepage
                </Label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving
                    ? 'Saving...'
                    : editing
                      ? 'Save Changes'
                      : 'Add Testimonial'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Testimonials Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-center font-medium">Rating</th>
              <th className="px-4 py-3 text-left font-medium">Review</th>
              <th className="px-4 py-3 text-center font-medium">Featured</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td colSpan={5} className="px-4 py-4">
                    <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
                  </td>
                </tr>
              ))
            ) : testimonials.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No testimonials yet. Add your first one!
                </td>
              </tr>
            ) : (
              testimonials.map((t) => (
                <tr key={t.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{t.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[t.company_name, t.location]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < t.rating
                              ? 'fill-brand-primary text-brand-primary'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="line-clamp-2 text-muted-foreground">
                      {t.review_text}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="secondary"
                      className={
                        t.featured
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }
                    >
                      {t.featured ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleFeatured(t)}
                        title={
                          t.featured
                            ? 'Remove from featured'
                            : 'Add to featured'
                        }
                      >
                        {t.featured ? (
                          <StarOff className="h-3.5 w-3.5" />
                        ) : (
                          <Star className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
