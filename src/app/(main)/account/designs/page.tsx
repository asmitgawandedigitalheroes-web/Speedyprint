'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-black">Saved Designs</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : designs.length === 0 ? (
        <div className="rounded-lg border border-brand-gray-light bg-white p-12 text-center">
          <p className="text-lg text-brand-gray-medium">No saved designs yet.</p>
          <Link href="/products" className="mt-4 inline-block rounded-lg bg-brand-red px-6 py-2 text-white hover:bg-brand-red-light">
            Start Designing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {designs.map((design) => (
            <div key={design.id} className="group relative overflow-hidden rounded-lg border border-brand-gray-light bg-white">
              <Link
                href={design.product_template_id ? `/designer/${design.product_template_id}?design=${design.id}` : '#'}
                className="block aspect-square bg-gray-50"
              >
                {design.thumbnail_url ? (
                  <img src={design.thumbnail_url} alt={design.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-brand-gray-medium">
                    No Preview
                  </div>
                )}
              </Link>
              <div className="p-3">
                <p className="truncate font-medium text-brand-black">{design.name}</p>
                <p className="text-xs text-brand-gray-medium">
                  {(design.product_template as any)?.name || 'Unknown'} &middot; {formatDate(design.updated_at)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(design.id)}
                className="absolute right-2 top-2 rounded bg-red-500/80 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
