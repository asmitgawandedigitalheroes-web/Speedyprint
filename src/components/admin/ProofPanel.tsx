'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Save,
  Send,
  UserCheck,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/utils/format'
import { SITE_URL } from '@/lib/utils/constants'
import type { Proof, OrderItem } from '@/types'

interface ProofPanelProps {
  orderId: string
  orderItems: OrderItem[]
  onRefresh?: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  pending:            { label: 'Awaiting Review', color: 'bg-blue-100 text-blue-700',    icon: Clock },
  approved:           { label: 'Approved',         color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  revision_requested: { label: 'Revision Needed',  color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  rejected:           { label: 'Rejected',          color: 'bg-red-100 text-red-700',     icon: XCircle },
}

function ProofVersionCard({
  proof,
  onSaveAdminNotes,
  onApproveOnBehalf,
}: {
  proof: Proof
  onSaveAdminNotes: (proofId: string, notes: string) => Promise<void>
  onApproveOnBehalf: (proofId: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(proof.status === 'pending')
  const [adminNotes, setAdminNotes] = useState(proof.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [viewMode, setViewMode] = useState<'pdf' | 'image'>('pdf')

  // Hybrid Proxy-Blob State
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const cfg = STATUS_CONFIG[proof.status] ?? STATUS_CONFIG['pending']
  const Icon = cfg.icon

  // Fetch PDF as blob via our proxy to bypass CORS, security blocks, and IDM
  useEffect(() => {
    let active = true
    const proxyUrl = `/api/proofs/${proof.id}/file`

    if (expanded && proof.id && !blobUrl) {
      setPreviewLoading(true)
      setPreviewError(null)
      fetch(`/api/proof-data/${proof.id}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const json = await res.json()
          if (!json.data) throw new Error('Missing data in response')
          
          // Convert Base64 back to Blob
          const binaryString = atob(json.data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const pdfBlob = new Blob([bytes], { type: 'application/pdf' })
          
          if (active) {
            const url = URL.createObjectURL(pdfBlob)
            setBlobUrl(url)
          }
        })
        .catch((err) => {
          if (active) {
            console.error('[ProofPreview] Proxy fetch failed:', err)
            setPreviewError('Failed to load preview. Please use the external link button.')
          }
        })
        .finally(() => {
          if (active) setPreviewLoading(false)
        })
    }

    return () => {
      active = false
    }
  }, [expanded, proof.id, blobUrl])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [blobUrl])

  const handleApprove = async () => {
    if (!confirm('Approve this proof on behalf of the customer? This will trigger production file generation.')) return
    setApproving(true)
    await onApproveOnBehalf(proof.id)
    setApproving(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await onSaveAdminNotes(proof.id, adminNotes)
    setSaving(false)
  }

  return (
    <div className={cn(
      'rounded-lg border transition-colors',
      proof.status === 'pending' ? 'border-blue-200 bg-blue-50/30' :
      proof.status === 'approved' ? 'border-green-200 bg-green-50/30' :
      proof.status === 'revision_requested' ? 'border-yellow-200 bg-yellow-50/30' :
      'border-gray-200 bg-white'
    )}>
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white',
            proof.status === 'approved' ? 'bg-green-500' :
            proof.status === 'revision_requested' ? 'bg-yellow-500' :
            'bg-blue-500'
          )}>
            v{proof.version}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Version {proof.version}</span>
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', cfg.color)}>
                <Icon className="h-3 w-3" />
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{formatDateTime(proof.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {proof.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50 text-xs"
              disabled={approving}
              onClick={(e) => { e.stopPropagation(); handleApprove() }}
            >
              {approving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              Approve on Behalf
            </Button>
          )}
          {proof.proof_file_url && (
            <Button
              size="sm"
              variant="ghost"
              asChild
              onClick={(e) => e.stopPropagation()}
              title="Open in new tab"
            >
              <a href={proof.proof_file_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          {/* Proof preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 rounded-md border bg-muted/50 p-0.5">
                <button
                  onClick={() => setViewMode('pdf')}
                  className={cn(
                    "flex items-center gap-1.5 rounded-[calc(var(--radius)-4px)] px-3 py-1 text-xs font-medium transition",
                    viewMode === 'pdf' ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  PDF View
                </button>
                <button
                  onClick={() => setViewMode('image')}
                  className={cn(
                    "flex items-center gap-1.5 rounded-[calc(var(--radius)-4px)] px-3 py-1 text-xs font-medium transition",
                    viewMode === 'image' ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Image View
                </button>
              </div>
            </div>

            <div className="relative min-h-[400px] overflow-hidden rounded-lg border bg-gray-50 flex flex-col items-center justify-center">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-2 py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-xs text-muted-foreground animate-pulse">Loading proof PDF...</p>
                </div>
              ) : previewError ? (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                  <XCircle className="h-8 w-8 text-red-400" />
                  <p className="text-sm font-medium text-gray-700">{previewError}</p>
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <a href={proof.proof_file_url || '#'} target="_blank" rel="noopener noreferrer">
                      Open Proof Manually
                    </a>
                  </Button>
                </div>
              ) : viewMode === 'image' ? (
                <div className="flex flex-col items-center justify-center p-4 w-full">
                  {proof.proof_thumbnail_url && !proof.proof_thumbnail_url.toLowerCase().endsWith('.pdf') ? (
                    <img
                      src={proof.proof_thumbnail_url}
                      alt={`Proof v${proof.version}`}
                      className="max-h-[600px] w-auto rounded-lg shadow-sm object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-12">
                      <ImageIcon className="h-8 w-8 text-gray-300" />
                      <p className="text-xs text-muted-foreground">No image version available</p>
                      <p className="max-w-[200px] text-[10px] text-muted-foreground/60 text-center px-4">This version only has a PDF proof. Please use "PDF View".</p>
                    </div>
                  )}
                </div>
              ) : blobUrl ? (
                <iframe
                  src={blobUrl}
                  className="h-[600px] w-full border-0"
                  title={`Proof v${proof.version}`}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-12">
                  <FileText className="h-8 w-8 text-gray-300" />
                  <p className="text-xs text-muted-foreground">No preview available</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer notes */}
          {proof.customer_notes && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="mb-1 text-xs font-semibold text-yellow-800">Customer Notes:</p>
              <p className="text-sm text-yellow-700">{proof.customer_notes}</p>
            </div>
          )}

          {/* Approval log */}
          {proof.status === 'approved' && (proof.responded_at || (proof as any).approved_ip) && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="mb-2 text-xs font-semibold text-green-800">Approval Log</p>
              <div className="space-y-1 text-xs text-green-700">
                {proof.responded_at && <p>Approved at: {formatDateTime(proof.responded_at)}</p>}
                {(proof as any).approved_ip && <p>IP Address: {(proof as any).approved_ip}</p>}
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">Internal Admin Notes (not visible to customer)</label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this proof version..."
              rows={3}
              className="text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={saving || adminNotes === (proof.admin_notes ?? '')}
              className="gap-2"
            >
              {saving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Notes
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function OrderItemProofSection({
  item,
  orderId,
}: {
  item: OrderItem
  orderId: string
}) {
  const [proofs, setProofs] = useState<Proof[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  const fetchProofs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/proofs/${item.id}`)
      if (res.ok) {
        const data = await res.json()
        setProofs(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [item.id])

  useEffect(() => {
    fetchProofs()
  }, [fetchProofs])

  const handleGenerateProof = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/proofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_item_id: item.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to generate proof')
        return
      }
      toast.success('Proof generated and email sent to customer!')
      await fetchProofs()
    } catch {
      toast.error('Failed to generate proof')
    } finally {
      setGenerating(false)
    }
  }

  const handleResendEmail = async () => {
    setSendingEmail(true)
    try {
      const proofUrl = `${SITE_URL}/account/orders/${orderId}/proof/${item.id}`
      const res = await fetch(`/api/admin/orders/${orderId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'proof', proofUrl }),
      })
      if (res.ok) {
        toast.success('Proof ready email sent to customer')
      } else {
        toast.error('Failed to send email')
      }
    } catch {
      toast.error('Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  const handleApproveOnBehalf = async (proofId: string) => {
    try {
      const res = await fetch(`/api/proofs/${proofId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Approved by admin on behalf of customer', on_behalf: true }),
      })
      if (res.ok) {
        toast.success('Proof approved on behalf of customer. Production files will be generated shortly.')
        await fetchProofs()
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to approve proof')
      }
    } catch {
      toast.error('Failed to approve proof')
    }
  }

  const handleSaveAdminNotes = async (proofId: string, notes: string) => {
    try {
      const res = await fetch(`/api/proofs/${proofId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: notes }),
      })
      if (res.ok) {
        toast.success('Admin notes saved')
        setProofs((prev) => prev.map((p) => p.id === proofId ? { ...p, admin_notes: notes } : p))
      } else {
        toast.error('Failed to save notes')
      }
    } catch {
      toast.error('Failed to save notes')
    }
  }

  const latestProof = proofs[0]
  const pendingProofs = proofs.filter((p) => p.status === 'pending')
  const canGenerateNew = !generating && (
    proofs.length === 0 ||
    latestProof?.status === 'revision_requested' ||
    latestProof?.status === 'rejected'
  )

  return (
    <div className="relative space-y-3">
      {/* Loading Overlay */}
      {generating && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-xl bg-white/70 backdrop-blur-[1px]">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="mt-2 text-sm font-medium text-brand-text">Generating Proof...</p>
          <p className="text-xs text-muted-foreground">This may take a few seconds</p>
        </div>
      )}

      {/* Item header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {(item.product_group as any)?.name ?? 'Product'} — {(item.product_template as any)?.name ?? 'Template'}
          </p>
          <p className="text-xs text-muted-foreground">
            {proofs.length} proof version{proofs.length !== 1 ? 's' : ''}
            {pendingProofs.length > 0 && (
              <span className="ml-2 text-blue-600 font-medium">({pendingProofs.length} awaiting customer review)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {proofs.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResendEmail}
              disabled={sendingEmail || generating}
              className="gap-1.5 text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              Resend Email
            </Button>
          )}
          {canGenerateNew && (
            <Button
              size="sm"
              variant="default"
              onClick={handleGenerateProof}
              disabled={generating}
              className="gap-2 min-w-[140px]"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  {proofs.length === 0 ? 'Generate Proof' : 'New Proof Version'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Proof versions */}
      {loading ? (
        <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
      ) : proofs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-muted-foreground">No proofs yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Click &quot;Generate Proof&quot; to create the first proof for this item.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {proofs.map((proof) => (
            <ProofVersionCard
              key={proof.id}
              proof={proof}
              onSaveAdminNotes={handleSaveAdminNotes}
              onApproveOnBehalf={handleApproveOnBehalf}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminProofPanel({ orderId, orderItems, onRefresh }: ProofPanelProps) {
  if (!orderItems || orderItems.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Proof Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {orderItems.map((item, index) => (
            <div key={item.id} className={cn('py-6 first:pt-0 last:pb-0', index === 0 ? '' : '')}>
              <OrderItemProofSection item={item} orderId={orderId} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
