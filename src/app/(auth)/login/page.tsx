'use client'

import { useState, type FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, ArrowRight } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { SITE_NAME } from '@/lib/utils/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const { login, isLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const { error } = await login(email, password)
    if (error) { toast.error(error); return }
    toast.success('Signed in successfully')
    // BUG-012 FIX: Validate that redirect is a relative path to prevent open redirect attacks.
    // An attacker could craft /login?redirect=https://phishing.com — after login the user
    // would be silently redirected to an external site. Only allow paths starting with '/'.
    const safeRedirect = redirect && redirect.startsWith('/') ? redirect : '/account'
    router.push(safeRedirect)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="h-1 w-8 bg-brand-primary mb-4" />
        <h1 className="font-heading text-2xl font-bold text-brand-text">Welcome back</h1>
        <p className="mt-1 text-sm text-brand-text-muted">Sign in to your {SITE_NAME} account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
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
          <Input
            id="password"
            type="password"
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
