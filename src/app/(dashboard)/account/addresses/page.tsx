'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Plus, Trash2, Loader2, CheckCircle2, Star } from 'lucide-react'
import { toast } from 'sonner'

interface Address {
  id: string
  label: string
  full_name: string
  line1: string
  line2?: string
  city: string
  province: string
  postal_code: string
  country: string
  is_default: boolean
}

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
]

const EMPTY_FORM = {
  label: '', full_name: '', line1: '', line2: '',
  city: '', province: '', postal_code: '', country: 'South Africa', is_default: false,
}

export default function AddressesPage() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!user) return
    loadAddresses()
  }, [user])

  async function loadAddresses() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user!.id)
      .order('is_default', { ascending: false })
    if (!error && data) setAddresses(data as Address[])
    setLoading(false)
  }

  function setField(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const supabase = createClient()
      // If setting as default, clear existing defaults first
      if (form.is_default) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
      }
      const { error } = await supabase
        .from('user_addresses')
        .insert({ ...form, user_id: user.id })
      if (error) throw error
      toast.success('Address saved')
      setShowForm(false)
      setForm(EMPTY_FORM)
      await loadAddresses()
    } catch {
      toast.error('Could not save address. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('user_addresses').delete().eq('id', id)
      if (error) throw error
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      toast.success('Address removed')
    } catch {
      toast.error('Could not remove address.')
    } finally {
      setDeleting(null)
    }
  }

  async function handleSetDefault(id: string) {
    if (!user) return
    try {
      const supabase = createClient()
      await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id)
      await supabase.from('user_addresses').update({ is_default: true }).eq('id', id)
      await loadAddresses()
      toast.success('Default address updated')
    } catch {
      toast.error('Could not update default address.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text">Address book</h1>
          <p className="mt-1 text-sm text-brand-text-muted">Saved delivery addresses for faster checkout.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            <Plus className="h-4 w-4" /> Add address
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 font-heading text-base font-semibold text-brand-text">New address</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-brand-text">Address label</label>
                <input required type="text" placeholder="e.g. Home, Office, Warehouse" value={form.label} onChange={(e) => setField('label', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-brand-text">Full name</label>
                <input required type="text" value={form.full_name} onChange={(e) => setField('full_name', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-brand-text">Street address</label>
                <input required type="text" placeholder="Street, unit number" value={form.line1} onChange={(e) => setField('line1', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-brand-text">Suburb / complex (optional)</label>
                <input type="text" value={form.line2} onChange={(e) => setField('line2', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-text">City</label>
                <input required type="text" value={form.city} onChange={(e) => setField('city', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brand-text">Postal code</label>
                <input required type="text" value={form.postal_code} onChange={(e) => setField('postal_code', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-brand-text">Province</label>
                <select required value={form.province} onChange={(e) => setField('province', e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary">
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setField('is_default', e.target.checked)}
                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
              />
              <span className="text-sm text-brand-text">Set as default delivery address</span>
            </label>

            <div className="flex gap-3 border-t border-gray-100 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><CheckCircle2 className="h-4 w-4" /> Save address</>}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-brand-text transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-white/60 border border-gray-100" />)}
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <MapPin className="mx-auto h-10 w-10 text-gray-200" />
          <h3 className="mt-3 font-heading text-base font-semibold text-brand-text">No saved addresses</h3>
          <p className="mt-1 text-sm text-brand-text-muted">Add a delivery address for faster checkout.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
          >
            <Plus className="h-4 w-4" /> Add your first address
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className={`rounded-xl border bg-white p-5 shadow-sm ${addr.is_default ? 'border-brand-primary/40' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-brand-text">{addr.label}</p>
                      {addr.is_default && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold text-brand-primary">
                          <Star className="h-2.5 w-2.5" /> Default
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-brand-text-muted">{addr.full_name}</p>
                    <p className="text-sm text-brand-text-muted">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                    <p className="text-sm text-brand-text-muted">{addr.city}, {addr.province}, {addr.postal_code}</p>
                    <p className="text-sm text-brand-text-muted">{addr.country}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-brand-text transition hover:border-brand-primary hover:text-brand-primary"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deleting === addr.id}
                    className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    aria-label="Delete address"
                  >
                    {deleting === addr.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
