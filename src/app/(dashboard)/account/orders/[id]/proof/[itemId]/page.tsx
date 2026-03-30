'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime } from '@/lib/utils/format'
import { toast } from 'sonner'
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  ArrowLeft,
  FileText,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import type { Proof } from '@/types'

/* ─── Brand-safe status config (NO green / NO blue) ─── */
interface StatusCfg {
  label:   string
  bg:      string
  text:    string
  border:  string
  icon:    React.ElementType
}

const STATUS_CFG: Record<string, StatusCfg> = {
  pending: {
    label:  'Awaiting Your Review',
    bg:     'rgba(255,193,7,0.12)',
    text:   '#7a5c00',
    border: 'rgba(255,193,7,0.45)',
    icon:   Clock,
  },
  approved: {
    label:  'Approved — In Production',
    bg:     'rgba(30,41,59,0.08)',
    text:   '#1E293B',
    border: 'rgba(30,41,59,0.18)',
    icon:   CheckCircle2,
  },
  revision_requested: {
    label:  'Revision Requested',
    bg:     'rgba(255,193,7,0.10)',
    text:   '#7a5c00',
    border: 'rgba(255,193,7,0.35)',
    icon:   AlertCircle,
  },
  rejected: {
    label:  'Rejected',
    bg:     'rgba(227,6,19,0.08)',
    text:   '#c00510',
    border: 'rgba(227,6,19,0.25)',
    icon:   AlertCircle,
  },
}

export default function ProofReviewPage() {
  const { id: orderId, itemId } = useParams<{ id: string; itemId: string }>()
  const { user } = useAuth()
  const [proofs,         setProofs]         = useState<Proof[]>([])
  const [selectedProof,  setSelectedProof]  = useState<Proof | null>(null)
  const [notes,          setNotes]          = useState('')
  const [loading,        setLoading]        = useState(true)
  const [submitting,     setSubmitting]     = useState(false)
  const [viewMode,       setViewMode]       = useState<'pdf' | 'image'>('pdf')

  const fetchProofs = useCallback(async () => {
    if (!itemId) return
    try {
      const res = await fetch(`/api/proofs/${itemId}`)
      if (res.ok) {
        const data: Proof[] = await res.json()
        setProofs(data)
        if (data.length > 0 && !selectedProof) setSelectedProof(data[0])
      }
    } catch {
      toast.error('Failed to load proofs')
    } finally {
      setLoading(false)
    }
  }, [itemId, selectedProof])

  useEffect(() => {
    if (user && itemId) fetchProofs()
  }, [user, itemId, fetchProofs])

  const handleApprove = async () => {
    if (!selectedProof) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/proofs/${selectedProof.id}/approve`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error()
      toast.success('Proof approved! We\'ll begin production shortly.')
      setSelectedProof((p) => p ? { ...p, status: 'approved', responded_at: new Date().toISOString() } : p)
      setProofs((prev) => prev.map((p) => p.id === selectedProof.id ? { ...p, status: 'approved' } : p))
    } catch {
      toast.error('Failed to approve. Please try again.')
    }
    setSubmitting(false)
  }

  const handleRequestRevision = async () => {
    if (!selectedProof) return
    if (!notes.trim()) {
      toast.error('Please describe the changes needed before requesting a revision.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/proofs/${selectedProof.id}/revision`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error()
      toast.success('Revision requested. Our team will send you an updated proof.')
      setSelectedProof((p) =>
        p ? { ...p, status: 'revision_requested', customer_notes: notes } : p
      )
      setProofs((prev) =>
        prev.map((p) => p.id === selectedProof.id ? { ...p, status: 'revision_requested' } : p)
      )
      setNotes('')
    } catch {
      toast.error('Failed to request revision. Please try again.')
    }
    setSubmitting(false)
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 h-5 w-32 animate-pulse rounded bg-white" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-[520px] animate-pulse rounded-xl bg-white lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    )
  }

  const activeCfg = selectedProof
    ? (STATUS_CFG[selectedProof.status] ?? STATUS_CFG['pending'])
    : null

  return (
    <div className="p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="mb-6">
        <Link
          href={`/account/orders/${orderId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand-text-muted transition hover:text-brand-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Order
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-bold text-brand-text">Proof Review</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Review your design proof carefully before approving for production.
        </p>
      </div>

      {/* ── Empty state ── */}
      {proofs.length === 0 ? (
        <div className="rounded-xl border border-[#E7E5E4] bg-white py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F6F7]">
            <FileText className="h-6 w-6 text-brand-text-muted" />
          </div>
          <p className="font-heading text-base font-semibold text-brand-text">No proof available yet</p>
          <p className="mt-2 max-w-sm mx-auto text-sm text-brand-text-muted">
            Our team is preparing your proof. You&apos;ll receive an email when it&apos;s ready.
          </p>
          <button
            onClick={fetchProofs}
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Check again
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Left: Proof viewer ── */}
          <div className="space-y-4 lg:col-span-2">

            {/* Status banner */}
            {activeCfg && selectedProof && (
              <div
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ backgroundColor: activeCfg.bg, borderColor: activeCfg.border }}
              >
                <activeCfg.icon
                  className="h-5 w-5 shrink-0"
                  style={{ color: activeCfg.text }}
                />
                <div>
                  <p className="text-sm font-semibold" style={{ color: activeCfg.text }}>
                    {activeCfg.label}
                  </p>
                  {selectedProof.responded_at && selectedProof.status !== 'pending' && (
                    <p className="mt-0.5 text-xs opacity-80" style={{ color: activeCfg.text }}>
                      {formatDateTime(selectedProof.responded_at)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Viewer card */}
            <div className="overflow-hidden rounded-xl border border-[#E7E5E4] bg-white shadow-sm">
              {/* Toolbar */}
              <div className="flex items-center justify-between border-b border-[#E7E5E4] px-4 py-3">
                <div className="flex items-center gap-1 rounded-lg border border-[#E7E5E4] bg-[#F5F6F7] p-0.5">
                  {(['pdf', 'image'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium transition"
                      style={
                        viewMode === mode
                          ? { background: '#fff', color: '#1E293B', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                          : { color: '#64748B' }
                      }
                    >
                      {mode === 'pdf' ? 'PDF View' : 'Image View'}
                    </button>
                  ))}
                </div>

                {selectedProof?.proof_file_url && (
                  <a
                    href={selectedProof.proof_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7E5E4] px-3 py-1.5 text-xs font-medium transition hover:border-brand-primary hover:text-brand-primary"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Proof
                  </a>
                )}
              </div>

              {/* Preview area */}
              <div className="flex min-h-[480px] items-center justify-center overflow-hidden bg-[#F5F6F7]">
                {selectedProof?.proof_file_url ? (
                  viewMode === 'pdf' ? (
                    <iframe
                      src={`${selectedProof.proof_file_url}#toolbar=0`}
                      className="h-[480px] w-full"
                      title={`Proof v${selectedProof?.version}`}
                    />
                  ) : (
                    <img
                      src={selectedProof.proof_thumbnail_url ?? selectedProof.proof_file_url}
                      alt={`Proof v${selectedProof?.version}`}
                      className="max-h-[480px] max-w-full object-contain p-6"
                    />
                  )
                ) : (
                  <div className="text-center text-brand-text-muted">
                    <FileText className="mx-auto mb-2 h-12 w-12 opacity-25" />
                    <p className="text-sm">Preview not available</p>
                  </div>
                )}
              </div>

              {/* ── Action area: pending proofs only ── */}
              {selectedProof?.status === 'pending' && (
                <div className="border-t border-[#E7E5E4] p-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-brand-text">
                      Notes
                      <span className="ml-1 font-normal text-brand-text-muted text-xs">
                        (required if requesting revision)
                      </span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe any changes needed, or leave a message for our team…"
                      rows={3}
                      className="w-full rounded-lg border border-[#E7E5E4] px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/25"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    {/* Approve — brand primary red */}
                    <button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
                    >
                      {submitting
                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                        : <CheckCircle2 className="h-4 w-4" />}
                      Approve &amp; Start Production
                    </button>

                    {/* Revision — brand yellow */}
                    <button
                      onClick={handleRequestRevision}
                      disabled={submitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition disabled:opacity-50"
                      style={{
                        borderColor:     'rgba(255,193,7,0.6)',
                        backgroundColor: 'rgba(255,193,7,0.08)',
                        color:           '#7a5c00',
                      }}
                    >
                      {submitting
                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                        : <AlertCircle className="h-4 w-4" />}
                      Request Revision
                    </button>
                  </div>

                  <p className="text-center text-xs text-brand-text-muted">
                    Revisions are free and unlimited. Once approved, production begins immediately.
                  </p>
                </div>
              )}

              {/* Approved state footer */}
              {selectedProof?.status === 'approved' && (
                <div
                  className="border-t p-5"
                  style={{
                    backgroundColor: 'rgba(30,41,59,0.06)',
                    borderColor:     'rgba(30,41,59,0.15)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-brand-primary" />
                    <div>
                      <p className="text-sm font-semibold text-brand-text">
                        You approved this proof
                        {selectedProof.responded_at
                          ? ` on ${formatDateTime(selectedProof.responded_at)}`
                          : ''}
                        .
                      </p>
                      <p className="mt-0.5 text-xs text-brand-text-muted">
                        Production files are being generated. Your order is now in production.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Revision requested state footer */}
              {selectedProof?.status === 'revision_requested' && (
                <div
                  className="border-t p-5"
                  style={{
                    backgroundColor: 'rgba(255,193,7,0.07)',
                    borderColor:     'rgba(255,193,7,0.3)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className="mt-0.5 h-5 w-5 shrink-0"
                      style={{ color: '#7a5c00' }}
                    />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#7a5c00' }}>
                        Revision requested
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: '#7a5c00', opacity: 0.8 }}>
                        Our team is working on an updated proof. You&apos;ll be notified by email.
                      </p>
                      {selectedProof.customer_notes && (
                        <div
                          className="mt-2 rounded p-2 text-xs"
                          style={{ backgroundColor: 'rgba(255,193,7,0.15)', color: '#7a5c00' }}
                        >
                          <span className="font-semibold">Your notes: </span>
                          {selectedProof.customer_notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Version history + help ── */}
          <div className="space-y-4">

            {/* Version history */}
            <div className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
              <h2 className="mb-3 font-heading text-sm font-semibold text-brand-text">
                Version History
              </h2>
              <div className="flex flex-col gap-2">
                {proofs.map((proof) => {
                  const cfg  = STATUS_CFG[proof.status] ?? STATUS_CFG['pending']
                  const Icon = cfg.icon
                  const isSelected = selectedProof?.id === proof.id
                  return (
                    <button
                      key={proof.id}
                      onClick={() => { setSelectedProof(proof); setNotes('') }}
                      className="w-full rounded-xl border p-3 text-left transition-all"
                      style={{
                        borderColor:     isSelected ? '#E30613' : '#E7E5E4',
                        backgroundColor: isSelected ? 'rgba(227,6,19,0.04)' : '#fff',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Version circle */}
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{
                              backgroundColor:
                                proof.status === 'approved'
                                  ? '#1E293B'
                                  : proof.status === 'revision_requested'
                                  ? '#FFC107'
                                  : proof.status === 'rejected'
                                  ? '#E30613'
                                  : '#64748B',
                            }}
                          >
                            v{proof.version}
                          </div>
                          <span className="text-sm font-medium text-brand-text">
                            Version {proof.version}
                          </span>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: cfg.bg, color: cfg.text }}
                        >
                          <Icon className="h-3 w-3" />
                          {proof.status === 'pending'
                            ? 'Review'
                            : proof.status === 'approved'
                            ? 'Approved'
                            : proof.status === 'revision_requested'
                            ? 'Revision'
                            : proof.status}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-brand-text-muted">
                        {formatDateTime(proof.created_at)}
                      </p>
                      {proof.customer_notes && (
                        <p className="mt-1 truncate text-xs text-brand-text-muted italic">
                          &ldquo;{proof.customer_notes}&rdquo;
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* How proofing works */}
            <div className="rounded-xl border border-[#E7E5E4] bg-[#FAFAFA] p-4">
              <h3 className="mb-3 font-heading text-sm font-semibold text-brand-text">
                How Proofing Works
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-brand-text-muted">
                <li>Review the proof — check spelling, layout &amp; colours</li>
                <li>
                  Click <strong className="text-brand-primary">Approve</strong> to start production,
                  or <strong>Request Revision</strong> for changes
                </li>
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
