'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'
import { PenLine, Trash2, Copy, ArrowRight, Palette, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import type { Design } from '@/types'

export default function SavedDesignsPage() {
  const { user } = useAuth()
  const [designs,  setDesigns]  = useState<Design[]>([])
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase
      .from('designs')
      .select('*, product_template:product_templates(name)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setDesigns((data as Design[]) || [])
        setLoading(false)
      })
  }, [user])

  const handleDelete = async (designId: string) => {
    if (!confirm('Delete this design? This cannot be undone.')) return
    setDeleting(designId)
    const supabase = createClient()
    const { error } = await supabase.from('designs').delete().eq('id', designId)
    if (error) {
      toast.error('Failed to delete design.')
    } else {
      setDesigns((prev) => prev.filter((d) => d.id !== designId))
      toast.success('Design deleted.')
    }
    setDeleting(null)
  }

  const handleDuplicate = async (design: Design) => {
    if (!user) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('designs')
      .insert({
        user_id:             user.id,
        product_template_id: design.product_template_id,
        name:                `${design.name} (copy)`,
        canvas_json:         design.canvas_json,
        thumbnail_url:       design.thumbnail_url,
        is_saved_template:   false,
      })
      .select()
      .single()

    if (error) {
      toast.error('Failed to duplicate design.')
    } else {
      setDesigns((prev) => [data as Design, ...prev])
      toast.success('Design duplicated.')
    }
  }

  return (
    <div className="p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">Account</p>
          <h1 className="mt-1 font-heading text-2xl font-bold text-brand-text">Saved Designs</h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Your saved designs ready to order or continue editing.
          </p>
        </div>
        <Link
          href="/templates"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
        >
          <PenLine className="h-4 w-4" />
          New Design
        </Link>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : designs.length === 0 ? (
        <div className="rounded-xl border border-[#E7E5E4] bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F6F7]">
            <Palette className="h-6 w-6 text-brand-text-muted" />
          </div>
          <p className="font-heading text-base font-semibold text-brand-text">No saved designs yet</p>
          <p className="mt-1 text-sm text-brand-text-muted">
            Start from a template and your design will be saved here.
          </p>
          <Link
            href="/templates"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            Browse Templates <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {designs.map((design) => {
              const editHref = design.product_template_id
                ? `/designer/${design.product_template_id}?design=${design.id}`
                : '#'

              return (
                <div
                  key={design.id}
                  className="group relative overflow-hidden rounded-xl border border-[#E7E5E4] bg-white shadow-sm transition hover:border-brand-primary/30 hover:shadow-md"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square overflow-hidden bg-[#F5F6F7]">
                    {design.thumbnail_url ? (
                      <img
                        src={design.thumbnail_url}
                        alt={design.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Palette className="h-10 w-10 text-[#D0D0D0]" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-secondary/75 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                      <Link
                        href={editHref}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-primary-dark"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" /> Use Design
                      </Link>
                      <Link
                        href={editHref}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
                      >
                        <PenLine className="h-3.5 w-3.5" /> Edit
                      </Link>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-text">{design.name}</p>
                      <p className="truncate text-xs text-brand-text-muted">
                        {(design.product_template as any)?.name || 'Template'} &middot;{' '}
                        {formatDate(design.updated_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(design)}
                        title="Duplicate"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-text-muted transition hover:bg-[#F5F6F7] hover:text-brand-text"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(design.id)}
                        disabled={deleting === design.id}
                        title="Delete"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-brand-text-muted transition hover:bg-brand-primary/10 hover:text-brand-primary disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-xs text-brand-text-muted">
            {designs.length} design{designs.length !== 1 ? 's' : ''} saved
          </p>
        </>
      )}
    </div>
  )
}
