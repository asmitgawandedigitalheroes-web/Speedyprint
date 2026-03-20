'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { SA_PROVINCES } from '@/lib/utils/constants'
import { toast } from 'sonner'

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

  // Password change state
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

    if (error) {
      toast.error('Failed to update profile')
    } else {
      toast.success('Profile updated')
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
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setChangingPassword(true)
    const { error } = await updatePassword(newPassword)
    setChangingPassword(false)

    if (error) {
      toast.error(error)
    } else {
      toast.success('Password changed successfully')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <h1 className="text-2xl font-bold text-brand-black">My Profile</h1>

      {/* ── Profile Info ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-brand-gray-light bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-gray">Full Name</label>
            <input name="full_name" value={form.full_name} onChange={handleChange}
              className="w-full rounded-lg border border-brand-gray-light px-3 py-2 focus:border-brand-red focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-gray">Company Name</label>
            <input name="company_name" value={form.company_name} onChange={handleChange}
              className="w-full rounded-lg border border-brand-gray-light px-3 py-2 focus:border-brand-red focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-gray">Email</label>
          <input value={user.email || ''} disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-brand-gray-medium" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-gray">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange}
            className="w-full rounded-lg border border-brand-gray-light px-3 py-2 focus:border-brand-red focus:outline-none" />
        </div>

        <hr className="border-brand-gray-light" />

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-gray">Address Line 1</label>
          <input name="address_line1" value={form.address_line1} onChange={handleChange}
            className="w-full rounded-lg border border-brand-gray-light px-3 py-2 focus:border-brand-red focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-gray">Address Line 2</label>
          <input name="address_line2" value={form.address_line2} onChange={handleChange}
            className="w-full rounded-lg border border-brand-gray-light px-3 py-2 focus:border-brand-red focus:outline-none" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-gray">City</label>
            <input name="city" value={form.city} onChange={handleChange}
              className="w-full rounded-lg border border-brand-gray-light px-3 py-2 focus:border-brand-red focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-gray">Province</label>
            <select name="province" value={form.province} onChange={handleChange}
              className="w-full rounded-lg border border-brand-gray-light px-3 py-2 focus:border-brand-red focus:outline-none">
              <option value="">Select...</option>
              {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-gray">Postal Code</label>
            <input name="postal_code" value={form.postal_code} onChange={handleChange}
              className="w-full rounded-lg border border-brand-gray-light px-3 py-2 focus:border-brand-red focus:outline-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-red px-6 py-2.5 font-medium text-white transition hover:bg-brand-red-light disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* ── Change Password ───────────────────────────────────────────────── */}
      <form onSubmit={handlePasswordChange} className="space-y-5 rounded-lg border border-brand-gray-light bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-brand-black">Change Password</h2>
          <p className="mt-0.5 text-sm text-brand-gray-medium">
            Leave blank if you don&apos;t want to change your password.
          </p>
        </div>

        <hr className="border-brand-gray-light" />

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-gray">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            className="w-full rounded-lg border border-brand-gray-light px-3 py-2 focus:border-brand-red focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-gray">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            autoComplete="new-password"
            className="w-full rounded-lg border border-brand-gray-light px-3 py-2 focus:border-brand-red focus:outline-none"
          />
        </div>

        {passwordError && (
          <p className="text-sm text-red-600">{passwordError}</p>
        )}

        <button
          type="submit"
          disabled={changingPassword || !newPassword}
          className="rounded-lg bg-brand-red px-6 py-2.5 font-medium text-white transition hover:bg-brand-red-light disabled:opacity-50"
        >
          {changingPassword ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
