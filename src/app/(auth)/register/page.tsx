'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, ArrowRight, Mail } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { SITE_NAME } from '@/lib/utils/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuth()

  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [emailSent, setEmailSent] = useState(false)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.fullName = 'Full name is required'
    if (!email.trim()) e.email = 'Email is required'
    if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    const { error, emailConfirmationRequired } = await register(email, password, fullName.trim(), companyName.trim() || undefined)
    if (error) { toast.error(error); return }
    if (emailConfirmationRequired) { setEmailSent(true); return }
    toast.success('Account created successfully!')
    router.push('/account')
  }

  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-brand-primary/10">
          <Mail className="h-8 w-8 text-brand-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Check your email</h1>
          <p className="mt-2 text-sm text-brand-text-muted">
            We sent a confirmation link to{' '}
            <span className="font-medium text-brand-text">{email}</span>.
            Click the link to activate your account.
          </p>
        </div>
        <p className="text-sm text-brand-text-muted">
          Already confirmed?{' '}
          <Link href="/login" className="font-medium text-brand-primary hover:text-brand-primary-dark transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="h-1 w-8 bg-brand-primary mb-4" />
        <h1 className="font-heading text-2xl font-bold text-brand-text">Create an account</h1>
        <p className="mt-1 text-sm text-brand-text-muted">Get started with {SITE_NAME}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" disabled={isLoading} />
          {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company name <span className="font-normal text-brand-text-muted">(optional)</span></Label>
          <Input id="companyName" type="text" placeholder="Acme Corp" value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoComplete="organization" disabled={isLoading} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" disabled={isLoading} />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Minimum 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" disabled={isLoading} />
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" disabled={isLoading} />
          {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
        </div>

        <Button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white gap-2" disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
          ) : (
            <><span>Create account</span><ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-brand-text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-primary hover:text-brand-primary-dark transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
