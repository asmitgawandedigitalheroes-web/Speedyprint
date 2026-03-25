'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, MailCheck, KeyRound } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { SITE_NAME } from '@/lib/utils/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'request' | 'sent' | 'update' | 'done'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { resetPassword, updatePassword, isLoading } = useAuth()

  const [mode, setMode] = useState<Mode>('request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('type') === 'recovery') {
      setMode('update')
    }
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('update')
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleRequestReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const { error } = await resetPassword(email)
    if (error) { toast.error(error); return }
    setMode('sent')
  }

  async function handleUpdatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordError('')
    if (password.length < 8) { setPasswordError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setPasswordError('Passwords do not match.'); return }
    setSaving(true)
    const { error } = await updatePassword(password)
    setSaving(false)
    if (error) { toast.error(error); return }
    setMode('done')
    toast.success('Password updated successfully!')
    setTimeout(() => router.push('/account'), 2000)
  }

  if (mode === 'sent') {
    return (
      <div className="space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-brand-primary/10">
          <MailCheck className="h-8 w-8 text-brand-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Check your email</h1>
          <p className="mt-2 text-sm text-brand-text-muted">
            We sent a password reset link to{' '}
            <span className="font-medium text-brand-text">{email}</span>.
          </p>
        </div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => setMode('request')}>
            Try a different email
          </Button>
          <Link href="/login" className="inline-flex items-center gap-1 text-sm text-brand-primary hover:text-brand-primary-dark transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  if (mode === 'update' || mode === 'done') {
    return (
      <div className="space-y-8">
        <div>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-primary/10">
            <KeyRound className="h-6 w-6 text-brand-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Set new password</h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Choose a strong password for your {SITE_NAME} account.
          </p>
        </div>

        {mode === 'done' ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Password updated! Redirecting to your account…
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" placeholder="Minimum 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" disabled={saving} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input id="confirm-password" type="password" placeholder="Repeat your new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" disabled={saving} />
            </div>
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…</> : 'Update password'}
            </Button>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="h-1 w-8 bg-brand-primary mb-4" />
        <h1 className="font-heading text-2xl font-bold text-brand-text">Reset your password</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleRequestReset} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" disabled={isLoading} />
        </div>
        <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : 'Send reset link'}
        </Button>
      </form>

      <p className="text-center">
        <Link href="/login" className="inline-flex items-center gap-1 text-sm text-brand-primary hover:text-brand-primary-dark transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </p>
    </div>
  )
}
