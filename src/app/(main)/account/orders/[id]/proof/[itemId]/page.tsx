'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime } from '@/lib/utils/format'
import { toast } from 'sonner'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  ArrowLeft,
  FileText,
  RefreshCw,
} from 'lucide-react'
import type { Proof } from '@/types'

const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string; icon: React.FC<{className?: string}> }> = {
  pending:            { label: 'Awaiting Your Review', bgColor: 'bg-blue-50',   textColor: 'text-blue-700',   borderColor: 'border-blue-200',  icon: Clock },
  approved:           { label: 'Approved',              bgColor: 'bg-green-50',  textColor: 'text-green-700',  borderColor: 'border-green-200', icon: CheckCircle },
  revision_requested: { label: 'Revision Requested',    bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200', icon: AlertCircle },
  rejected:           { label: 'Rejected',               bgColor: 'bg-red-50',   textColor: 'text-red-700',    borderColor: 'border-red-200',   icon: AlertCircle },
}

export default function ProofReviewPage() {
  const { id: orderId, itemId } = useParams<{ id: string; itemId: string }>()
  const { user } = useAuth()
  const [proofs, setProofs] = useState<Proof[]>([])
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'pdf' | 'image'>('pdf')

  const fetchProofs = useCallback(async () => {
    if (!itemId) return
    try {
      const res = await fetch(`/api/proofs/${itemId}`)
      if (res.ok) {
        const data: Proof[] = await res.json()
        setProofs(data)
        if (data.length > 0 && !selectedProof) {
          setSelectedProof(data[0])
        }
      }
    } catch {
      toast.error('Failed to load proofs')
    } finally {
      setLoading(false)
    }
  }, [itemId, selectedProof])

  useEffect(() => {
    if (user && itemId) {
      fetchProofs()
    }
  }, [user, itemId, fetchProofs])

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
      toast.success('Proof approved! We\'ll begin production shortly.')
      setSelectedProof((prev) => prev ? { ...prev, status: 'approved', responded_at: new Date().toISOString() } : prev)
      setProofs((prev) => prev.map((p) => p.id === selectedProof.id ? { ...p, status: 'approved' } : p))
    } catch {
      toast.error('Failed to approve proof. Please try again.')
    }
    setSubmitting(false)
  }

  const handleRequestRevision = async () => {
    if (!selectedProof) return
    if (!notes.trim()) {
      toast.error('Please describe the changes you need before requesting a revision.')
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
      toast.success('Revision requested. Our team will update the proof and notify you.')
      setSelectedProof((prev) => prev ? { ...prev, status: 'revision_requested', customer_notes: notes } : prev)
      setProofs((prev) => prev.map((p) => p.id === selectedProof.id ? { ...p, status: 'revision_requested' } : p))
      setNotes('')
    } catch {
      toast.error('Failed to request revision. Please try again.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200 mb-6" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-[500px] animate-pulse rounded-lg bg-gray-100" />
          <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
    )
  }

  const activeCfg = selectedProof ? (STATUS_CONFIG[selectedProof.status] ?? STATUS_CONFIG['pending']) : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/account/orders/${orderId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand-gray-medium hover:text-brand-red"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Order
        </Link>
        <h1 className="text-2xl font-bold text-brand-black">Proof Review</h1>
        <p className="mt-1 text-sm text-brand-gray-medium">
          Review your design proof carefully before approving for production.
        </p>
      </div>

      {proofs.length === 0 ? (
        <div className="rounded-xl border border-brand-gray-light bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <h2 className="text-lg font-semibold text-brand-black">No proof available yet</h2>
          <p className="mt-2 text-brand-gray-medium">
            Our team is preparing your proof. You&apos;ll receive an email when it&apos;s ready for review.
          </p>
          <button
            onClick={fetchProofs}
            className="mt-4 inline-flex items-center gap-2 text-sm text-brand-red hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Check again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left — Proof Viewer */}
          <div className="space-y-4 lg:col-span-2">
            {/* Status banner */}
            {activeCfg && selectedProof && (
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${activeCfg.bgColor} ${activeCfg.borderColor}`}>
                <activeCfg.icon className={`h-5 w-5 shrink-0 ${activeCfg.textColor}`} />
                <div>
                  <p className={`text-sm font-semibold ${activeCfg.textColor}`}>{activeCfg.label}</p>
                  {selectedProof.responded_at && selectedProof.status !== 'pending' && (
                    <p className={`text-xs ${activeCfg.textColor} opacity-80`}>
                      {formatDateTime(selectedProof.responded_at)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Proof viewer card */}
            <div className="overflow-hidden rounded-xl border border-brand-gray-light bg-white shadow-sm">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
                  <button
                    onClick={() => setViewMode('pdf')}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${viewMode === 'pdf' ? 'bg-white shadow text-brand-black' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    PDF View
                  </button>
                  <button
                    onClick={() => setViewMode('image')}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${viewMode === 'image' ? 'bg-white shadow text-brand-black' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Image View
                  </button>
                </div>
                {selectedProof?.proof_file_url && (
                  <a
                    href={selectedProof.proof_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-gray-light px-3 py-1.5 text-xs font-medium hover:border-brand-red hover:text-brand-red"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Proof
                  </a>
                )}
              </div>

              {/* Viewer */}
              <div className="flex min-h-[480px] items-center justify-center bg-gray-50">
                {selectedProof?.proof_file_url ? (
                  viewMode === 'pdf' ? (
                    <iframe
                      src={`${selectedProof.proof_file_url}#toolbar=0`}
                      className="h-[480px] w-full"
                      title={`Proof version ${selectedProof.version}`}
                    />
                  ) : (
                    <img
                      src={selectedProof.proof_thumbnail_url ?? selectedProof.proof_file_url}
                      alt={`Proof v${selectedProof.version}`}
                      className="max-h-[480px] max-w-full object-contain p-4"
                    />
                  )
                ) : (
                  <div className="text-center text-brand-gray-medium">
                    <FileText className="mx-auto mb-2 h-12 w-12 opacity-30" />
                    <p className="text-sm">Proof preview not available</p>
                  </div>
                )}
              </div>

              {/* Action area — only for pending proofs */}
              {selectedProof?.status === 'pending' && (
                <div className="border-t p-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-brand-black">
                      Notes <span className="font-normal text-brand-gray-medium">(required if requesting revision)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe any changes needed, or leave a message for our team..."
                      className="w-full rounded-lg border border-brand-gray-light px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Approve Proof &amp; Start Production
                    </button>
                    <button
                      onClick={handleRequestRevision}
                      disabled={submitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-yellow-400 bg-yellow-50 py-3 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-100 disabled:opacity-50"
                    >
                      {submitting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      Request Revision
                    </button>
                  </div>
                  <p className="text-center text-xs text-brand-gray-medium">
                    Once approved, your order will move to production. Revisions are free and unlimited.
                  </p>
                </div>
              )}

              {/* Approved state */}
              {selectedProof?.status === 'approved' && (
                <div className="border-t bg-green-50 p-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        You approved this proof{selectedProof.responded_at ? ` on ${formatDateTime(selectedProof.responded_at)}` : ''}.
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">Production files are being generated. Your order is now in production.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Revision requested state */}
              {selectedProof?.status === 'revision_requested' && (
                <div className="border-t bg-yellow-50 p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800">Revision requested</p>
                      <p className="text-xs text-yellow-600 mt-0.5">Our team is working on an updated proof. You&apos;ll be notified by email.</p>
                      {selectedProof.customer_notes && (
                        <div className="mt-2 rounded bg-yellow-100 p-2 text-xs text-yellow-700">
                          <span className="font-medium">Your notes: </span>
                          {selectedProof.customer_notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Version History */}
          <div className="space-y-4">
            <div className="rounded-xl border border-brand-gray-light bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-brand-black">Version History</h2>
              <div className="space-y-2">
                {proofs.map((proof) => {
                  const cfg = STATUS_CONFIG[proof.status] ?? STATUS_CONFIG['pending']
                  const Icon = cfg.icon
                  return (
                    <button
                      key={proof.id}
                      onClick={() => { setSelectedProof(proof); setNotes('') }}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${
                        selectedProof?.id === proof.id
                          ? 'border-brand-red bg-red-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                            proof.status === 'approved' ? 'bg-green-500' :
                            proof.status === 'revision_requested' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}>
                            v{proof.version}
                          </div>
                          <span className="text-sm font-medium text-brand-black">Version {proof.version}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bgColor} ${cfg.textColor}`}>
                          <Icon className="h-3 w-3" />
                          {proof.status === 'pending' ? 'Review' :
                           proof.status === 'approved' ? 'Approved' :
                           proof.status === 'revision_requested' ? 'Revision' : proof.status}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-brand-gray-medium">{formatDateTime(proof.created_at)}</p>
                      {proof.customer_notes && (
                        <p className="mt-1 truncate text-xs text-brand-gray-medium italic">
                          &ldquo;{proof.customer_notes}&rdquo;
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Help card */}
            <div className="rounded-xl border border-brand-gray-light bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-brand-black">How Proofing Works</h3>
              <ol className="space-y-2 text-xs text-brand-gray-medium list-decimal list-inside">
                <li>Review the proof carefully — check spelling, layout, and colours</li>
                <li>Click <strong>Approve</strong> to start production, or <strong>Request Revision</strong> to request changes</li>
                <li>Revisions are free — we&apos;ll send you an updated proof</li>
                <li>Once approved, your order moves into production</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
