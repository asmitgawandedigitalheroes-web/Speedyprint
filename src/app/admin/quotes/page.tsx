'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Send,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  DollarSign,
  Loader2,
  User,
  Building2,
  Phone,
  Mail,
  CalendarDays,
  Package,
  Ruler,
  Layers,
  Sparkles,
  MessageSquare,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDate, formatDateTime as formatDateTimeFn } from '@/lib/utils/format'

/* ── Types ─────────────────────────────────────────────────────────────── */
type QuoteStatus = 'new' | 'reviewing' | 'quoted' | 'accepted' | 'rejected' | 'expired'

interface QuoteRequest {
  id: string
  full_name: string
  email: string
  phone?: string
  company?: string
  event_name?: string
  event_date?: string
  delivery_date?: string
  product_type?: string
  quantity?: string
  dimensions?: string
  material?: string
  finish?: string
  special_instructions?: string
  referral?: string
  artwork_url?: string
  status: QuoteStatus
  quoted_price?: number | null
  quote_valid_days?: number | null
  admin_notes?: string | null
  reply_message?: string | null
  replied_at?: string | null
  created_at: string
  updated_at: string
}

/* ── Status config ──────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  new:       { label: 'New',       color: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500',   icon: Eye         },
  reviewing: { label: 'Reviewing', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500',  icon: Clock       },
  quoted:    { label: 'Quoted',    color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', icon: FileText  },
  accepted:  { label: 'Accepted',  color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500',  icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  color: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-500',    icon: XCircle     },
  expired:   { label: 'Expired',   color: 'bg-gray-50 text-gray-500 border-gray-200',    dot: 'bg-gray-400',   icon: AlertCircle },
}

const STATUS_TABS: { key: 'all' | QuoteStatus; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'new',       label: 'New'       },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'quoted',    label: 'Quoted'    },
  { key: 'accepted',  label: 'Accepted'  },
  { key: 'rejected',  label: 'Rejected'  },
  { key: 'expired',   label: 'Expired'   },
]

/* ── Helpers ──────────────────────────────────────────────────────────── */
function fmt(d?: string | null) {
  if (!d) return '—'
  try { return formatDate(d) } catch { return d }
}
function fmtDateTime(d?: string | null) {
  if (!d) return '—'
  try { return formatDateTimeFn(d) } catch { return d }
}

/* ── Status Badge ─────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: QuoteStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', cfg.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

/* ── Detail Row ───────────────────────────────────────────────────────── */
function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  )
}

/* ── Main Page ────────────────────────────────────────────────────────── */
export default function AdminQuotesPage() {
  const [quotes, setQuotes]     = useState<QuoteRequest[]>([])
  const [total, setTotal]       = useState(0)
  const [newCount, setNewCount] = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [activeStatus, setActiveStatus] = useState<'all' | QuoteStatus>('all')
  const [expandedId, setExpandedId]     = useState<string | null>(null)

  // Reply dialog state
  const [replyingId, setReplyingId]       = useState<string | null>(null)
  const [replyMsg, setReplyMsg]           = useState('')
  const [replyPrice, setReplyPrice]       = useState('')
  const [replyValidDays, setReplyValidDays] = useState('14')
  const [replySending, setReplySending]   = useState(false)

  // Inline status change
  const [patchingId, setPatchingId] = useState<string | null>(null)

  // Admin notes
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [notesValue, setNotesValue]         = useState('')
  const [notesSaving, setNotesSaving]       = useState(false)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (activeStatus !== 'all') params.set('status', activeStatus)
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/admin/quotes?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setQuotes(data.quotes ?? [])
      setTotal(data.total ?? 0)
      setNewCount(data.newCount ?? 0)
    } catch {
      toast.error('Failed to load quote requests')
    } finally {
      setLoading(false)
    }
  }, [activeStatus, search])

  useEffect(() => {
    const t = setTimeout(fetchQuotes, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchQuotes, search])

  /* Stats */
  const stats = useMemo(() => {
    const counts = Object.fromEntries(
      Object.keys(STATUS_CONFIG).map((s) => [s, 0])
    ) as Record<QuoteStatus, number>
    // Use local data for display counts when filter is 'all'
    if (activeStatus === 'all') {
      quotes.forEach((q) => { counts[q.status] = (counts[q.status] ?? 0) + 1 })
    }
    return counts
  }, [quotes, activeStatus])

  /* Patch status */
  async function patchStatus(id: string, status: QuoteStatus) {
    setPatchingId(id)
    try {
      const res = await fetch(`/api/admin/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setQuotes((prev) => prev.map((q) => q.id === id ? updated : q))
      toast.success(`Status updated to "${STATUS_CONFIG[status].label}"`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setPatchingId(null)
    }
  }

  /* Save admin notes */
  async function saveNotes(id: string) {
    setNotesSaving(true)
    try {
      const res = await fetch(`/api/admin/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: notesValue }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setQuotes((prev) => prev.map((q) => q.id === id ? updated : q))
      setEditingNotesId(null)
      toast.success('Notes saved')
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setNotesSaving(false)
    }
  }

  /* Send reply */
  async function sendReply() {
    if (!replyingId || !replyMsg.trim()) return
    setReplySending(true)
    try {
      const body: Record<string, unknown> = { reply_message: replyMsg.trim() }
      if (replyPrice) body.quoted_price = parseFloat(replyPrice)
      if (replyValidDays) body.quote_valid_days = parseInt(replyValidDays)

      const res = await fetch(`/api/admin/quotes/${replyingId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      const updated = await res.json()
      setQuotes((prev) => prev.map((q) => q.id === replyingId ? updated : q))
      toast.success('Quote reply sent!')
      setReplyingId(null)
      setReplyMsg('')
      setReplyPrice('')
      setReplyValidDays('14')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setReplySending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page Header ── */}
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Quote Requests</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                {total} total{newCount > 0 && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{newCount} new</span>}
              </p>
            </div>
            <button
              onClick={fetchQuotes}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </button>
          </div>

          {/* Stats Strip */}
          {activeStatus === 'all' && !search && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {(Object.keys(STATUS_CONFIG) as QuoteStatus[]).map((s) => {
                const cfg = STATUS_CONFIG[s]
                return (
                  <button
                    key={s}
                    onClick={() => setActiveStatus(s)}
                    className="group rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition hover:border-gray-200 hover:bg-white"
                  >
                    <p className="text-lg font-bold text-gray-900">{stats[s]}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                      <p className="text-xs text-gray-500">{cfg.label}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* ── Filters ── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, company, event…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.key)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                  activeStatus === tab.key
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-primary/50 hover:text-brand-primary hover:bg-brand-primary/5'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Quotes List ── */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <p className="font-medium text-gray-500">No quote requests found</p>
            {(search || activeStatus !== 'all') && (
              <button onClick={() => { setSearch(''); setActiveStatus('all') }} className="text-sm text-blue-600 hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => {
              const isExpanded = expandedId === quote.id
              const isReplying = replyingId === quote.id
              const isEditingNotes = editingNotesId === quote.id

              return (
                <div
                  key={quote.id}
                  className={cn(
                    'rounded-2xl border bg-white shadow-sm transition-all',
                    quote.status === 'new' ? 'border-blue-200' : 'border-gray-200'
                  )}
                >
                  {/* ── Card Header ── */}
                  <div
                    className="flex cursor-pointer items-center gap-4 px-5 py-4"
                    onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                  >
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                      {quote.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">{quote.full_name}</p>
                        {quote.company && <span className="text-sm text-gray-500">· {quote.company}</span>}
                        <StatusBadge status={quote.status} />
                        {quote.status === 'new' && (
                          <span className="animate-pulse rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>{quote.email}</span>
                        {quote.product_type && <span>· {quote.product_type}</span>}
                        {quote.quantity && <span>· Qty: {quote.quantity}</span>}
                        <span>· {fmtDateTime(quote.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {quote.quoted_price && (
                        <span className="font-bold text-green-600">R {quote.quoted_price.toFixed(2)}</span>
                      )}
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-gray-400" />
                        : <ChevronDown className="h-4 w-4 text-gray-400" />
                      }
                    </div>
                  </div>

                  {/* ── Expanded Detail ── */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                      <div className="grid gap-6 lg:grid-cols-3">

                        {/* Contact + Project */}
                        <div className="space-y-4">
                          <div>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact</p>
                            <div className="space-y-2">
                              <DetailRow icon={User}       label="Full Name" value={quote.full_name} />
                              <DetailRow icon={Mail}       label="Email"     value={quote.email} />
                              <DetailRow icon={Phone}      label="Phone"     value={quote.phone} />
                              <DetailRow icon={Building2}  label="Company"   value={quote.company} />
                            </div>
                          </div>
                          <div>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Project</p>
                            <div className="space-y-2">
                              <DetailRow icon={Sparkles}    label="Event / Project"   value={quote.event_name} />
                              <DetailRow icon={CalendarDays} label="Event Date"        value={fmt(quote.event_date)} />
                              <DetailRow icon={CalendarDays} label="Required Delivery" value={fmt(quote.delivery_date)} />
                            </div>
                          </div>
                        </div>

                        {/* Product Spec */}
                        <div>
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Product Specification</p>
                          <div className="space-y-2">
                            <DetailRow icon={Package} label="Product Type" value={quote.product_type} />
                            <DetailRow icon={Package} label="Quantity"     value={quote.quantity} />
                            <DetailRow icon={Ruler}   label="Dimensions"   value={quote.dimensions} />
                            <DetailRow icon={Layers}  label="Material"     value={quote.material} />
                            <DetailRow icon={Sparkles} label="Finish"      value={quote.finish} />
                            {quote.referral && <DetailRow icon={MessageSquare} label="Referral" value={quote.referral} />}
                          </div>
                          {quote.special_instructions && (
                            <div className="mt-3 rounded-lg bg-gray-50 p-3">
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Special Instructions</p>
                              <p className="whitespace-pre-wrap text-sm text-gray-700">{quote.special_instructions}</p>
                            </div>
                          )}
                          {quote.artwork_url && (
                            <a
                              href={quote.artwork_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download Artwork
                            </a>
                          )}
                        </div>

                        {/* Actions + Notes */}
                        <div className="space-y-4">
                          {/* Status Selector */}
                          <div>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {(Object.keys(STATUS_CONFIG) as QuoteStatus[]).map((s) => {
                                const cfg = STATUS_CONFIG[s]
                                const isActive = quote.status === s
                                return (
                                  <button
                                    key={s}
                                    disabled={patchingId === quote.id || isActive}
                                    onClick={() => patchStatus(quote.id, s)}
                                    className={cn(
                                      'flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition',
                                      isActive
                                        ? cn(cfg.color, 'cursor-default')
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                    )}
                                  >
                                    <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                                    {cfg.label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Admin Notes */}
                          <div>
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Admin Notes</p>
                              {!isEditingNotes && (
                                <button
                                  onClick={() => { setEditingNotesId(quote.id); setNotesValue(quote.admin_notes ?? '') }}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  {quote.admin_notes ? 'Edit' : 'Add note'}
                                </button>
                              )}
                            </div>
                            {isEditingNotes ? (
                              <div className="space-y-2">
                                <textarea
                                  rows={3}
                                  value={notesValue}
                                  onChange={(e) => setNotesValue(e.target.value)}
                                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                                  placeholder="Internal notes (not visible to customer)…"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveNotes(quote.id)}
                                    disabled={notesSaving}
                                    className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50"
                                  >
                                    {notesSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                    Save
                                  </button>
                                  <button onClick={() => setEditingNotesId(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : quote.admin_notes ? (
                              <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{quote.admin_notes}</p>
                            ) : (
                              <p className="text-sm text-gray-400 italic">No notes yet</p>
                            )}
                          </div>

                          {/* Replied info */}
                          {quote.replied_at && (
                            <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-green-700">Quote Sent</p>
                              <p className="text-xs text-green-700">{fmtDateTime(quote.replied_at)}</p>
                              {quote.quoted_price && <p className="mt-1 text-sm font-bold text-green-800">R {quote.quoted_price.toFixed(2)}</p>}
                            </div>
                          )}

                          {/* Send Quote Button */}
                          {!isReplying && (
                            <button
                              onClick={() => { setReplyingId(quote.id); setReplyMsg(''); setReplyPrice(''); setReplyValidDays('14') }}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-primary-dark shadow-red-100/50"
                            >
                              <Send className="h-4 w-4" />
                              {quote.replied_at ? 'Re-send Quote' : 'Send Quote Reply'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ── Reply Panel ── */}
                      {isReplying && (
                        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="mb-3 text-sm font-semibold text-gray-900">Send Quote to {quote.full_name}</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600">
                                <DollarSign className="mr-1 inline h-3 w-3" />Quoted Price (ZAR) <span className="text-gray-400">(optional)</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="e.g. 1250.00"
                                value={replyPrice}
                                onChange={(e) => setReplyPrice(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-600">
                                <Clock className="mr-1 inline h-3 w-3" />Valid for (days)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="90"
                                value={replyValidDays}
                                onChange={(e) => setReplyValidDays(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                              <MessageSquare className="mr-1 inline h-3 w-3" />Message to Customer <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              rows={5}
                              value={replyMsg}
                              onChange={(e) => setReplyMsg(e.target.value)}
                              placeholder={`Hi ${quote.full_name.split(' ')[0]},\n\nThank you for your quote request. Here are the details…`}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                            />
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={sendReply}
                              disabled={replySending || !replyMsg.trim()}
                              className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-primary-dark shadow-red-100/50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {replySending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              {replySending ? 'Sending…' : 'Send Quote'}
                            </button>
                            <button
                              onClick={() => setReplyingId(null)}
                              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
