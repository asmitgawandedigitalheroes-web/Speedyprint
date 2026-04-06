'use client'

import { useState, useEffect, type FormEvent } from 'react'
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
  })

  // Address management state
  const [addresses, setAddresses] = useState<any[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)


  const fetchAddresses = async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
    setAddresses(data || [])
    setLoadingAddresses(false)
  }

  useEffect(() => {
    fetchAddresses()
  }, [user])

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

  const handleDeleteAddress = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('user_addresses').delete().eq('id', id)
    if (error) toast.error('Failed to delete address.')
    else {
      toast.success('Address deleted.')
      fetchAddresses()
    }
  }

  const handleSetDefaultAddress = async (id: string) => {
    const supabase = createClient()
    // First, clear all defaults for this user
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', user?.id)
    
    // Then set the new default
    const { error } = await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', id)
    
    if (error) toast.error('Failed to set default address.')
    else {
      fetchAddresses()
    }
  }

  const handleAddressFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return
    const formData = new FormData(e.currentTarget)
    const addressData = {
      user_id: user.id,
      label: formData.get('label') as string,
      address_line1: formData.get('address_line1') as string,
      address_line2: formData.get('address_line2') as string,
      city: formData.get('city') as string,
      province: formData.get('province') as string,
      postal_code: formData.get('postal_code') as string,
      is_default: editingAddress ? editingAddress.is_default : (addresses.length === 0)
    }

    const supabase = createClient()
    let error;
    if (editingAddress) {
      ({ error } = await supabase.from('user_addresses').update(addressData).eq('id', editingAddress.id))
    } else {
      ({ error } = await supabase.from('user_addresses').insert(addressData))
    }

    if (error) toast.error('Failed to save address.')
    else {
      toast.success(editingAddress ? 'Address updated.' : 'Address added.')
      setShowAddressForm(false)
      setEditingAddress(null)
      fetchAddresses()
    }
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

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* ── Saved Addresses ── */}
        <div className="rounded-xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <SectionHeader
              icon={MapPin}
              title="Delivery Addresses"
              subtitle="Save up to 3 addresses for faster checkout."
            />
            {addresses.length < 3 && !showAddressForm && (
              <button
                onClick={() => {
                  setEditingAddress(null)
                  setShowAddressForm(true)
                }}
                className="text-xs font-bold uppercase tracking-wider text-brand-primary hover:text-brand-primary-dark transition-colors"
              >
                + Add New
              </button>
            )}
          </div>

          {showAddressForm ? (
            <form onSubmit={handleAddressFormSubmit} className="space-y-4 border-t border-[#E7E5E4] pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>Label (e.g. Home, Office)</label>
                  <input
                    name="label"
                    required
                    defaultValue={editingAddress?.label || ''}
                    className={INPUT}
                    placeholder="Home"
                  />
                </div>
                <div>
                  <label className={LABEL}>Postal Code</label>
                  <input
                    name="postal_code"
                    required
                    defaultValue={editingAddress?.postal_code || ''}
                    className={INPUT}
                    placeholder="0000"
                  />
                </div>
              </div>
              <div>
                <label className={LABEL}>Address Line 1</label>
                <input
                  name="address_line1"
                  required
                  defaultValue={editingAddress?.address_line1 || ''}
                  className={INPUT}
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className={LABEL}>Address Line 2 (Optional)</label>
                <input
                  name="address_line2"
                  defaultValue={editingAddress?.address_line2 || ''}
                  className={INPUT}
                  placeholder="Unit, suite, etc."
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL}>City</label>
                  <input
                    name="city"
                    required
                    defaultValue={editingAddress?.city || ''}
                    className={INPUT}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className={LABEL}>Province</label>
                  <select
                    name="province"
                    required
                    defaultValue={editingAddress?.province || ''}
                    className={INPUT}
                  >
                    <option value="">Select…</option>
                    {SA_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(false)
                    setEditingAddress(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-brand-text-muted hover:text-brand-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark transition-colors"
                >
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {loadingAddresses ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 rounded-lg bg-[#F5F6F7]" />
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <p className="text-center py-6 text-sm text-brand-text-muted italic">
                  No addresses saved yet.
                </p>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`relative rounded-lg border p-4 transition-all ${
                      addr.is_default ? 'border-brand-primary/30 bg-brand-primary/[0.02]' : 'border-[#E7E5E4] bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-brand-text uppercase tracking-tight">{addr.label}</span>
                        {addr.is_default && (
                          <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Default</span>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setEditingAddress(addr)
                            setShowAddressForm(true)
                          }}
                          className="text-xs text-brand-primary hover:underline"
                        >
                          Edit
                        </button>
                        {!addr.is_default && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-xs text-brand-text-muted hover:text-brand-primary transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-brand-text line-clamp-1">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
                    <p className="text-sm text-brand-text-muted">{addr.city}, {addr.province}, {addr.postal_code}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

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
