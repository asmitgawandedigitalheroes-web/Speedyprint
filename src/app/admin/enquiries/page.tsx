'use client'

import { useEffect, useState } from 'react'
import { Mail, MailOpen, Reply, CheckCheck, Clock, ChevronDown, ChevronUp, Loader2, Inbox } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface Submission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'unread' | 'read' | 'replied'
  reply_message: string | null
  replied_at: string | null
  replied_by: string | null
  created_at: string
}

const STATUS_TABS = [
  { key: 'all',     label: 'All' },
  { key: 'unread',  label: 'Unread' },
  { key: 'read',    label: 'Read' },
  { key: 'replied', label: 'Replied' },
] as const

type StatusFilter = typeof STATUS_TABS[number]['key']

function statusBadge(status: Submission['status']) {
  if (status === 'unread')
    return <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/20">Unread</Badge>
  if (status === 'read')
    return <Badge variant="secondary">Read</Badge>
  return <Badge className="bg-green-100 text-green-700 border-green-200">Replied</Badge>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminEnquiriesPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replyTarget, setReplyTarget] = useState<Submission | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState('')

  async function fetchSubmissions(status: StatusFilter = filter) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/enquiries?status=${status}`)
      if (!res.ok) return
      const data = await res.json()
      setSubmissions(data.submissions ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleTabChange(tab: StatusFilter) {
    setFilter(tab)
    setExpanded(null)
    await fetchSubmissions(tab)
  }

  async function markRead(id: string) {
    await fetch(`/api/admin/enquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'read' }),
    })
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'read' } : s))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  function handleExpand(s: Submission) {
    if (expanded === s.id) {
      setExpanded(null)
      return
    }
    setExpanded(s.id)
    if (s.status === 'unread') {
      markRead(s.id)
    }
  }

  function openReply(s: Submission) {
    setReplyTarget(s)
    setReplyMessage('')
    setReplyError('')
  }

  async function handleSendReply() {
    if (!replyTarget || !replyMessage.trim()) return
    setSending(true)
    setReplyError('')
    try {
      const res = await fetch(`/api/admin/enquiries/${replyTarget.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyMessage: replyMessage.trim(),
          repliedBy: user?.id ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setReplyError(data.error || 'Failed to send reply.')
        return
      }
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === replyTarget.id
            ? { ...s, status: 'replied', reply_message: replyMessage.trim(), replied_at: new Date().toISOString() }
            : s
        )
      )
      setReplyTarget(null)
      if (data.emailWarning) {
        // BUG-061 FIX: Ensure the email warning is visible and doesn't disappear too quickly.
        // If the reply is saved but the email fails (e.g. unverified sender), the admin must know.
        setReplyError(data.emailWarning)
        // Note: we don't clear the error automatically here because we want the user to see it.
        // We set the target to the submission so the dialog stays open with the error.
        setReplyTarget(replyTarget) 
      }
    } catch {
      setReplyError('An unexpected error occurred.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Enquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer contact-form submissions — read and reply directly from here
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-brand-primary px-2 text-xs font-bold text-white">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              filter === tab.key
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-muted-foreground hover:text-brand-text'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 border-b px-4 py-4 last:border-0">
                <div className="h-4 w-4 animate-pulse rounded bg-gray-200 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-72 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Inbox className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-brand-text">No enquiries</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === 'all' ? 'No submissions yet.' : `No ${filter} enquiries.`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {submissions.map((s) => (
              <li key={s.id} className={cn('transition-colors', s.status === 'unread' && 'bg-brand-primary/[0.03]')}>
                {/* Row */}
                <div
                  className="flex items-start gap-4 px-4 py-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleExpand(s)}
                >
                  {/* Status icon */}
                  <div className="mt-0.5 shrink-0">
                    {s.status === 'unread' ? (
                      <Mail className="h-4 w-4 text-brand-primary" />
                    ) : s.status === 'replied' ? (
                      <CheckCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <MailOpen className="h-4 w-4 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-sm font-semibold truncate', s.status === 'unread' ? 'text-brand-text' : 'text-gray-700')}>
                        {s.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{s.email}</span>
                      {statusBadge(s.status)}
                    </div>
                    <p className={cn('text-sm mt-0.5 truncate', s.status === 'unread' ? 'font-medium text-brand-text' : 'text-gray-600')}>
                      {s.subject}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      {formatDate(s.created_at)}
                    </p>
                  </div>

                  {/* Expand icon */}
                  <div className="shrink-0 mt-0.5">
                    {expanded === s.id
                      ? <ChevronUp className="h-4 w-4 text-gray-400" />
                      : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded body */}
                {expanded === s.id && (
                  <div className="px-12 pb-5 space-y-4">
                    <div className="rounded-md border border-gray-100 bg-gray-50 p-4 text-sm text-brand-text whitespace-pre-wrap">
                      {s.message}
                    </div>

                    {s.reply_message && (
                      <div className="rounded-md border border-green-100 bg-green-50 p-4 text-sm">
                        <p className="font-semibold text-green-700 mb-1">Reply sent {s.replied_at ? formatDate(s.replied_at) : ''}</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{s.reply_message}</p>
                      </div>
                    )}

                    {s.status !== 'replied' && (
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openReply(s) }}
                        className="gap-2"
                      >
                        <Reply className="h-3.5 w-3.5" />
                        Reply to {s.name}
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reply dialog */}
      <Dialog open={!!replyTarget} onOpenChange={(open) => { if (!open) setReplyTarget(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to {replyTarget?.name}</DialogTitle>
          </DialogHeader>

          {replyTarget && (
            <div className="space-y-4">
              {/* Original message preview */}
              <div className="rounded-md border-l-4 border-brand-primary bg-gray-50 p-3 text-sm text-gray-600">
                <p className="font-medium text-brand-text mb-1">{replyTarget.subject}</p>
                <p className="line-clamp-3">{replyTarget.message}</p>
              </div>

              {/* Reply textarea */}
              <div>
                <label className="block text-sm font-medium text-brand-text mb-1.5">
                  Your reply — will be sent to <span className="text-brand-primary">{replyTarget.email}</span>
                </label>
                <textarea
                  rows={6}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  disabled={sending}
                  placeholder="Type your reply here…"
                  className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
                />
              </div>

              {replyError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {replyError}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleSendReply}
                  disabled={sending || !replyMessage.trim()}
                  className="gap-2"
                >
                  {sending ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                  ) : (
                    <><Reply className="h-3.5 w-3.5" /> Send Reply</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setReplyTarget(null)} disabled={sending}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
