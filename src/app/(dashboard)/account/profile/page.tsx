'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { SA_PROVINCES } from '@/lib/utils/constants'
import { toast } from 'sonner'
import { User, MapPin, Lock, Mail } from 'lucide-react'

/* ─── Field helpers ─── */
const INPUT =
  'w-full rounded-lg border border-[#E0E0E0] bg-white px-3.5 py-2.5 text-sm text-brand-text transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20'
const LABEL =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-text-muted'
const DISABLED_INPUT =
  'w-full rounded-lg border border-[#E7E5E4] bg-[#F5F6F7] px-3.5 py-2.5 text-sm text-brand-text-muted cursor-not-allowed'

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F6F7]">
        <Icon className="h-4.5 w-4.5 text-brand-text-muted" />
      </div>
      <div>
        <h2 className="font-heading text-base font-semibold text-brand-text">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-brand-text-muted">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, refreshProfile, updatePassword } = useAuth()

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name:    user?.full_name    || '',
    company_name: user?.company_name || '',
    phone:        user?.phone        || '',
    address_line1: user?.address_line1 || '',
    address_line2: user?.address_line2 || '',
    city:          user?.city          || '',
    province:      user?.province      || '',
    postal_code:   user?.postal_code   || '',
  })

  const [newPassword,      setNewPassword]      = useState('')
  const [confirmPassword,  setConfirmPassword]  = useState('')
  const [passwordError,    setPasswordError]    = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    if (error) toast.error('Failed to update profile.')
    else {
      toast.success('Profile saved successfully.')
      await refreshProfile()
    }
    setSaving(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter.')
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('Password must contain at least one number.')
      return
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setPasswordError('Password must contain at least one special character (e.g. @, #, !).')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setChangingPassword(true)
    const { error } = await updatePassword(newPassword)
    setChangingPassword(false)
    if (error) toast.error(error)
    else {
      toast.success('Password updated successfully.')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (!user) return null

  /* Avatar initials */
  const initials = user.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  return (
    <div className="p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">Account</p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-brand-text">Profile Settings</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Manage your personal information, address, and password.
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-5">

        {/* ── Avatar row ── */}
        <div className="flex items-center gap-4 rounded-xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ background: '#E30613' }}
          >
            {initials}
          </div>
          <div>
            <p className="font-heading text-base font-semibold text-brand-text">
              {user.full_name || 'Your Name'}
            </p>
            <p className="text-sm text-brand-text-muted">{user.email}</p>
            <p className="mt-0.5 text-xs text-brand-text-muted capitalize">
              Account type: {user.role}
            </p>
          </div>
        </div>

        {/* ── Personal information ── */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#E7E5E4] bg-white p-6 shadow-sm"
        >
          <SectionHeader
            icon={User}
            title="Personal Information"
            subtitle="Update your name, company, and contact details."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Full Name</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className={INPUT}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className={LABEL}>Company Name</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                className={INPUT}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className={LABEL}>Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-text-muted" />
              <input
                value={user.email || ''}
                disabled
                className={`${DISABLED_INPUT} pl-9`}
              />
            </div>
            <p className="mt-1 text-xs text-brand-text-muted">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <div className="mt-4">
            <label className={LABEL}>Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={INPUT}
              placeholder="+27 00 000 0000"
            />
          </div>

          {/* Delivery address */}
          <div className="mt-6 border-t border-[#E7E5E4] pt-5">
            <SectionHeader
              icon={MapPin}
              title="Delivery Address"
              subtitle="Default shipping address for your orders."
            />

            <div className="space-y-4">
              <div>
                <label className={LABEL}>Address Line 1</label>
                <input
                  name="address_line1"
                  value={form.address_line1}
                  onChange={handleChange}
                  className={INPUT}
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className={LABEL}>Address Line 2</label>
                <input
                  name="address_line2"
                  value={form.address_line2}
                  onChange={handleChange}
                  className={INPUT}
                  placeholder="Unit, suite, complex (optional)"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={LABEL}>City</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className={INPUT}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className={LABEL}>Province</label>
                  <select
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    className={INPUT}
                  >
                    <option value="">Select…</option>
                    {SA_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Postal Code</label>
                  <input
                    name="postal_code"
                    value={form.postal_code}
                    onChange={handleChange}
                    className={INPUT}
                    placeholder="0000"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* ── Change password ── */}
        <form
          onSubmit={handlePasswordChange}
          className="rounded-xl border border-[#E7E5E4] bg-white p-6 shadow-sm"
        >
          <SectionHeader
            icon={Lock}
            title="Change Password"
            subtitle="Choose a strong password with at least 8 characters."
          />

          <div className="space-y-4">
            <div>
              <label className={LABEL}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
                className={INPUT}
              />
            </div>

            {passwordError && (
              <p
                className="rounded-lg border px-3 py-2.5 text-sm"
                style={{
                  backgroundColor: 'rgba(227,6,19,0.06)',
                  borderColor:     'rgba(227,6,19,0.25)',
                  color:           '#c00510',
                }}
              >
                {passwordError}
              </p>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={changingPassword || !newPassword}
              className="rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
            >
              {changingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
