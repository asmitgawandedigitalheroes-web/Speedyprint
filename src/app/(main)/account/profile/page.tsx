'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { SA_PROVINCES } from '@/lib/utils/constants'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth()
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

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-black">My Profile</h1>

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
    </div>
  )
}
