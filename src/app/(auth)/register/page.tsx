'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { SITE_NAME } from '@/lib/utils/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
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

  const [isSuccess, setIsSuccess] = useState(false)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.fullName = 'Full name is required'
    if (!email.trim()) e.email = 'Email is required'
    if (password.length < 8) {
      e.password = 'Password must be at least 8 characters'
    } else if (password.length > 15) {
      e.password = 'Password must be no more than 15 characters'
    } else if (/\s/.test(password)) {
      e.password = 'Password must not contain spaces'
    } else if (!/[A-Z]/.test(password)) {
      e.password = 'Password must contain at least one uppercase letter'
    } else if (!/[0-9]/.test(password)) {
      e.password = 'Password must contain at least one number'
    } else if (!/[^A-Za-z0-9\s]/.test(password)) {
      e.password = 'Password must contain at least one symbol (e.g. @, #, !)'
    }
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    const { error, emailConfirmationRequired } = await register(email, password, fullName.trim(), companyName.trim() || undefined)
    if (error) { toast.error(error); return }
    if (emailConfirmationRequired) {
      setIsSuccess(true)
      return
    }
    toast.success('Account created successfully!')
    router.push('/account')
  }

  if (isSuccess) {
    return (
      <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-green-50">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Check your email</h1>
          <p className="mt-2 text-sm text-brand-text-muted leading-relaxed">
            Account created! <br />
            <strong>We need to verify your account first.</strong> <br />
            Please check your inbox at <span className="font-medium text-brand-text">{email}</span> and click the activation link.
          </p>
        </div>
        <div className="pt-4 space-y-4">
          <Button asChild className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white">
            <Link href="/login">Go to sign in</Link>
          </Button>
          <p className="text-xs text-brand-text-muted">
            Didn&apos;t get the email? Check your spam folder or try signing in to resend.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
          <PasswordInput id="password" placeholder="8–15 chars, uppercase, number & symbol" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={15} pattern="(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])[^\s]{8,15}" title="8–15 characters, no spaces, at least 1 uppercase letter, 1 number and 1 symbol" autoComplete="new-password" disabled={isLoading} />
          {password.length > 0 && (
            <ul className="mt-2 space-y-1">
              {[
                { label: '8–15 characters', valid: password.length >= 8 && password.length <= 15 },
                { label: 'No spaces', valid: !/\s/.test(password) },
                { label: 'At least 1 uppercase letter', valid: /[A-Z]/.test(password) },
                { label: 'At least 1 number', valid: /[0-9]/.test(password) },
                { label: 'At least 1 symbol (e.g. @, #, !)', valid: /[^A-Za-z0-9\s]/.test(password) },
              ].map((rule) => (
                <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.valid ? 'text-green-600' : 'text-red-500'}`}>
                  {rule.valid
                    ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    : <XCircle className="h-3.5 w-3.5 shrink-0" />}
                  {rule.label}
                </li>
              ))}
            </ul>
          )}
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput id="confirmPassword" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" disabled={isLoading} />
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
