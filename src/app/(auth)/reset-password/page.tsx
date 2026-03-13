'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { SITE_NAME } from '@/lib/utils/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const { resetPassword, isLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const { error } = await resetPassword(email)

    if (error) {
      toast.error(error)
      return
    }

    setSent(true)
    toast.success('Reset link sent! Check your email.')
  }

  if (sent) {
    return (
      <div className="space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <MailCheck className="h-8 w-8 text-green-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-brand-black">
            Check your email
          </h1>
          <p className="text-brand-gray-medium">
            We sent a password reset link to{' '}
            <span className="font-medium text-brand-black">{email}</span>.
            Click the link in the email to reset your password.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSent(false)}
          >
            Try a different email
          </Button>

          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-brand-red hover:text-brand-red-dark transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-brand-black">
          Reset your password
        </h1>
        <p className="text-brand-gray-medium">
          Enter the email address associated with your {SITE_NAME} account and
          we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
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
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-brand-red hover:bg-brand-red-dark text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>

      {/* Footer link */}
      <p className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-brand-red hover:text-brand-red-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
