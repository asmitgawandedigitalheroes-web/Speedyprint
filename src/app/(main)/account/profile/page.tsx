'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { SA_PROVINCES } from '@/lib/utils/constants'
import { toast } from 'sonner'

const INPUT_CLASS = 'w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary'
const LABEL_CLASS = 'mb-1.5 block text-xs font-medium uppercase tracking-widest text-brand-text-muted'

export default function ProfilePage() {
  const { user, refreshProfile, updatePassword } = useAuth()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    company_name: user?.company_name || '',
    phone: user?.phone || '',
    address_line1: user?.address_line1 || '',
    address_line2: user?.address_line2 || '',
    city: user?.city || '',
    province: user?.province || '',
    postal_code: user?.postal_code || '',
  })

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
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
    if (error) toast.error('Failed to update profile')
    else { toast.success('Profile updated'); await refreshProfile() }
    setSaving(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return }
    setChangingPassword(true)
    const { error } = await updatePassword(newPassword)
    setChangingPassword(false)
    if (error) toast.error(error)
    else { toast.success('Password changed successfully'); setNewPassword(''); setConfirmPassword('') }
  }

  if (!user) return null

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <div className="h-1 w-8 bg-brand-primary mb-3" />
          <h1 className="font-heading text-2xl font-bold text-brand-text">My profile</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 space-y-6">
        {/* Profile info */}
        <form onSubmit={handleSubmit} className="rounded-md border border-gray-100 bg-white p-6 space-y-5">
          <h2 className="font-heading text-base font-semibold text-brand-text">Personal information</h2>
          <div className="h-px bg-gray-100" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Full name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Company name</label>
              <input name="company_name" value={form.company_name} onChange={handleChange} className={INPUT_CLASS} />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Email</label>
            <input value={user.email || ''} disabled className="w-full rounded-md border border-gray-100 bg-brand-bg px-3 py-2.5 text-sm text-brand-text-muted" />
          </div>

          <div>
            <label className={LABEL_CLASS}>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className={INPUT_CLASS} />
          </div>

          <div className="h-px bg-gray-100" />
          <h3 className="text-sm font-semibold text-brand-text">Delivery address</h3>

          <div>
            <label className={LABEL_CLASS}>Address line 1</label>
            <input name="address_line1" value={form.address_line1} onChange={handleChange} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Address line 2</label>
            <input name="address_line2" value={form.address_line2} onChange={handleChange} className={INPUT_CLASS} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={LABEL_CLASS}>City</label>
              <input name="city" value={form.city} onChange={handleChange} className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Province</label>
              <select name="province" value={form.province} onChange={handleChange} className={INPUT_CLASS}>
                <option value="">Select…</option>
                {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Postal code</label>
              <input name="postal_code" value={form.postal_code} onChange={handleChange} className={INPUT_CLASS} />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        {/* Password */}
        <form onSubmit={handlePasswordChange} className="rounded-md border border-gray-100 bg-white p-6 space-y-5">
          <div>
            <h2 className="font-heading text-base font-semibold text-brand-text">Change password</h2>
            <p className="mt-0.5 text-sm text-brand-text-muted">Leave blank if you don&apos;t want to change your password.</p>
          </div>
          <div className="h-px bg-gray-100" />

          <div>
            <label className={LABEL_CLASS}>New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" autoComplete="new-password" className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" autoComplete="new-password" className={INPUT_CLASS} />
          </div>
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}

          <button type="submit" disabled={changingPassword || !newPassword}
            className="rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-50">
            {changingPassword ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
