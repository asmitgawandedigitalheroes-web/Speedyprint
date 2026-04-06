'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, MailCheck, KeyRound } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { AuthChangeEvent } from '@supabase/supabase-js'
import { SITE_NAME } from '@/lib/utils/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
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
  const [isSending, setIsSending] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [errorParam, setErrorParam] = useState<string | null>(null)

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))

    if (queryParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery') {
      setMode('update')
    }
    const error = queryParams.get('error')
    if (error) {
      setErrorParam(error)
      if (error === 'otp_expired') {
        toast.error('The reset link has expired or has already been used. Please request a new one.')
      }
    }
    const supabase = createClient()
    
    // Check for session immediately if we have a recovery token
    if (queryParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery') {
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        if (session) setMode('update')
      })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'PASSWORD_RECOVERY') setMode('update')
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleRequestReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSending(true)
    try {
      const { error } = await resetPassword(email)
      if (error) {
        toast.error(error)
        return
      }
      setMode('sent')
    } catch (err) {
      console.error('[ResetPage] handleRequestReset error:', err)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  async function handleUpdatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordError('')
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter.')
      return
    }
    if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number.')
      return
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setPasswordError('Password must contain at least one special character (e.g. @, #, !).')
      return
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setSaving(true)
    
    // BUG-051 FIX: Ensure session exists before updating.
    // If the user lands here via a redirect that stripped the hash, 
    // or if the session expired, this will catch it before sending the update request.
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setSaving(false)
      toast.error('Your session has expired or the reset link is invalid. Please request a new one.')
      setMode('request')
      return
    }

    const { error } = await updatePassword(password)
    setSaving(false)
    if (error) {
      toast.error(error)
      return
    }
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
            We sent a password reset link to <span className="font-medium text-brand-text">{email}</span>.
          </p>
        </div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => setMode('request')}>
            Try a different email
          </Button>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-brand-primary hover:text-brand-primary-dark transition-colors"
          >
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
          <p className="mt-1 text-sm text-brand-text-muted">Choose a strong password for your {SITE_NAME} account.</p>
        </div>

        {mode === 'done' ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Password updated! Redirecting to your account…
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput
                id="new-password"
                placeholder="Min 8 chars, uppercase, number & symbol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <PasswordInput
                id="confirm-password"
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={saving}
              />
            </div>
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            <Button
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…
                </>
              ) : (
                'Update password'
              )}
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
        <p className="mt-1 text-sm text-brand-text-muted">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      <form onSubmit={handleRequestReset} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isSending}
          />
        </div>
        <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white" disabled={isSending}>
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            'Send reset link'
          )}
        </Button>
      </form>

      <p className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-brand-primary hover:text-brand-primary-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </p>
    </div>
  )
}
