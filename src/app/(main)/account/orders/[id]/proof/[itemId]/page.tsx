'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils/format'
import { toast } from 'sonner'
import type { Proof } from '@/types'

export default function ProofReviewPage() {
  const { id: orderId, itemId } = useParams<{ id: string; itemId: string }>()
  const { user } = useAuth()
  const [proofs, setProofs] = useState<Proof[]>([])
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user || !itemId) return
    const supabase = createClient()
    supabase
      .from('proofs')
      .select('*')
      .eq('order_item_id', itemId)
      .order('version', { ascending: false })
      .then(({ data }) => {
        const proofData = (data as Proof[]) || []
        setProofs(proofData)
        if (proofData.length > 0) setSelectedProof(proofData[0])
        setLoading(false)
      })
  }, [user, itemId])

  const handleApprove = async () => {
    if (!selectedProof) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/proofs/${selectedProof.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error('Failed to approve')
      toast.success('Proof approved! Production files will be generated.')
      setSelectedProof({ ...selectedProof, status: 'approved' })
    } catch {
      toast.error('Failed to approve proof')
    }
    setSubmitting(false)
  }

  const handleRequestRevision = async () => {
    if (!selectedProof || !notes.trim()) {
      toast.error('Please add notes explaining what changes you need')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/proofs/${selectedProof.id}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Revision requested. We\'ll update the proof shortly.')
      setSelectedProof({ ...selectedProof, status: 'revision_requested' })
    } catch {
      toast.error('Failed to request revision')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="h-96 animate-pulse rounded-lg bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={`/account/orders/${orderId}`} className="mb-4 inline-block text-sm text-brand-gray-medium hover:text-brand-red">
        &larr; Back to Order
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-brand-black">Proof Review</h1>

      {proofs.length === 0 ? (
        <div className="rounded-lg border border-brand-gray-light bg-white p-12 text-center">
          <p className="text-lg text-brand-gray-medium">No proofs available yet. We&apos;ll notify you when your proof is ready.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Proof Viewer */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg border border-brand-gray-light bg-white">
              <div className="flex h-[500px] items-center justify-center bg-gray-50">
                {selectedProof?.proof_file_url ? (
                  <img src={selectedProof.proof_file_url} alt={`Proof v${selectedProof.version}`} className="max-h-full max-w-full object-contain" />
                ) : (
                  <p className="text-brand-gray-medium">Proof preview not available</p>
                )}
              </div>
              {selectedProof && selectedProof.status === 'pending' && (
                <div className="border-t p-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes (required for revision requests)..."
                    className="mb-3 w-full rounded-lg border border-brand-gray-light px-3 py-2 text-sm focus:border-brand-red focus:outline-none"
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? '...' : 'Approve Proof'}
                    </button>
                    <button
                      onClick={handleRequestRevision}
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-yellow-500 py-2.5 font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                    >
                      Request Revision
                    </button>
                  </div>
                </div>
              )}
              {selectedProof?.status === 'approved' && (
                <div className="border-t bg-green-50 p-4 text-center text-green-700 font-medium">
                  Proof Approved — Production files are being generated
                </div>
              )}
              {selectedProof?.status === 'revision_requested' && (
                <div className="border-t bg-yellow-50 p-4 text-center text-yellow-700 font-medium">
                  Revision Requested — We&apos;re working on an updated proof
                </div>
              )}
            </div>
          </div>

          {/* Version History */}
          <div>
            <div className="rounded-lg border border-brand-gray-light bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-brand-black">Version History</h2>
              <div className="space-y-2">
                {proofs.map((proof) => (
                  <button
                    key={proof.id}
                    onClick={() => setSelectedProof(proof)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedProof?.id === proof.id ? 'border-brand-red bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Version {proof.version}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        proof.status === 'approved' ? 'bg-green-100 text-green-700' :
                        proof.status === 'revision_requested' ? 'bg-yellow-100 text-yellow-700' :
                        proof.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {proof.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-brand-gray-medium">{formatDateTime(proof.created_at)}</p>
                    {proof.customer_notes && (
                      <p className="mt-1 text-xs text-brand-gray-medium">Notes: {proof.customer_notes}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
