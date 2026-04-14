'use client'

import { useState, type FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, ArrowRight, MailWarning } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { SITE_NAME } from '@/lib/utils/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'

// BUG-007 FIX: Read the store snapshot after login completes to get the resolved role.
// Using getState() avoids adding 'user' as a component dependency (no re-render).
const getAuthUser = () => useAuth.getState().user

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const { login, isLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setUnconfirmedEmail(null)
    const { error, emailNotConfirmed } = await login(email, password)
    if (error) {
      if (emailNotConfirmed) {
        setUnconfirmedEmail(email)
      } else {
        toast.error(error)
      }
      return
    }
    toast.success('Signed in successfully')

    // BUG-007 FIX: Redirect based on role so customers never land on /admin.
    // Previously all users were sent to the `redirect` param verbatim, so a customer
    // who reached the login page via /admin (unauthenticated guard) was sent back to
    // /admin after login — showing the inline 403 error page.
    const loggedInUser = getAuthUser()
    const role = loggedInUser?.role ?? 'customer'
    const isAdminOrStaff = role === 'admin' || role === 'production_staff'

    // BUG-012 FIX: Validate redirect is a relative path to prevent open redirect attacks.
    const safeRedirect = redirect && redirect.startsWith('/') ? redirect : null

    if (isAdminOrStaff) {
      // Admin/staff: honour the redirect param (e.g. deep-link to /admin/orders)
      router.push(safeRedirect ?? '/admin')
    } else {
      // Customers: only honour non-admin redirects; never send a customer to /admin
      if (safeRedirect && !safeRedirect.startsWith('/admin')) {
        router.push(safeRedirect)
      } else {
        router.push('/account')
      }
    }
  }

  async function handleResendConfirmation() {
    if (!unconfirmedEmail) return
    setResending(true)
    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unconfirmedEmail }),
      })
      if (res.ok) {
        toast.success('Confirmation email sent — check your inbox')
      } else {
        toast.error('Could not resend confirmation email. Please try again.')
      }
    } catch {
      toast.error('Could not resend confirmation email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="h-1 w-8 bg-brand-primary mb-4" />
        <h1 className="font-heading text-2xl font-bold text-brand-text">Welcome back</h1>
        <p className="mt-1 text-sm text-brand-text-muted">Sign in to your {SITE_NAME} account</p>
      </div>

      {/* Email not confirmed banner */}
      {unconfirmedEmail && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-yellow-700" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-yellow-900">Email not confirmed</p>
            <p className="mt-0.5 text-xs text-yellow-800">
              Please check your inbox and click the confirmation link, then sign in again.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
            onClick={handleResendConfirmation}
            disabled={resending}
          >
            {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Resend email'}
          </Button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} method="post" className="space-y-5">
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
            disabled={isLoading}
            className="focus:border-brand-primary focus:ring-brand-primary"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/reset-password"
              className="text-xs text-brand-primary hover:text-brand-primary-dark transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={isLoading}
            className="focus:border-brand-primary focus:ring-brand-primary"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
          ) : (
            <><span>Sign in</span><ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-brand-text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-brand-primary hover:text-brand-primary-dark transition-colors">
          Create one
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
