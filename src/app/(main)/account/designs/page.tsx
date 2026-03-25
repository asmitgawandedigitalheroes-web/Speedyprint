'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'
import { PenLine, Trash2, ArrowRight } from 'lucide-react'
import type { Design } from '@/types'

export default function SavedDesignsPage() {
  const { user } = useAuth()
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)

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
    const supabase = createClient()
    await supabase.from('designs').delete().eq('id', designId)
    setDesigns((prev) => prev.filter((d) => d.id !== designId))
  }

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-3" />
          <h1 className="font-heading text-2xl font-bold text-brand-text">Saved designs</h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-md bg-white border border-gray-100" />
            ))}
          </div>
        ) : designs.length === 0 ? (
          <div className="rounded-md border border-gray-100 bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md border border-gray-100 bg-brand-bg">
              <PenLine className="h-6 w-6 text-brand-primary" />
            </div>
            <p className="font-heading text-base font-semibold text-brand-text">No saved designs yet</p>
            <p className="mt-1 text-sm text-brand-text-muted">Start designing from a template</p>
            <Link href="/templates" className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark">
              Browse templates <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {designs.map((design) => (
              <div key={design.id} className="group relative overflow-hidden rounded-md border border-gray-100 bg-white transition hover:border-brand-primary/30 hover:shadow-sm">
                <Link
                  href={design.product_template_id ? `/designer/${design.product_template_id}?design=${design.id}` : '#'}
                  className="block aspect-square overflow-hidden bg-brand-bg"
                >
                  {design.thumbnail_url ? (
                    <img src={design.thumbnail_url} alt={design.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-brand-text-muted">No preview</div>
                  )}
                </Link>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-brand-text">{design.name}</p>
                  <p className="mt-0.5 truncate text-xs text-brand-text-muted">
                    {(design.product_template as any)?.name || 'Unknown'} · {formatDate(design.updated_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(design.id)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-brand-text-muted opacity-0 shadow-sm transition hover:text-red-500 group-hover:opacity-100"
                  aria-label="Delete design"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
