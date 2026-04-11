'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, MessageCircle, Globe, Truck, Palette, DollarSign, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { PageHeader, SectionCard } from '@/components/admin/AdminUI'

function SettingField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  )
}

function SettingInput({
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
  readOnly,
}: {
  id?: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  type?: string
  step?: string
  readOnly?: boolean
}) {
  return (
    <input
      id={id}
      type={type}
      step={step}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      readOnly={readOnly}
      className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 placeholder:text-gray-400 read-only:bg-gray-50 read-only:text-gray-500"
    />
  )
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => setSettings(data.settings || {}))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    const vatRate = parseFloat(settings.vat_rate || '0')
    if (settings.vat_rate !== undefined && (isNaN(vatRate) || vatRate < 0 || vatRate > 1)) {
      toast.error('VAT rate must be between 0 and 1 (e.g. 0.15 for 15%)')
      return
    }
    const freeThreshold = parseFloat(settings.free_delivery_threshold || '0')
    if (settings.free_delivery_threshold !== undefined && (isNaN(freeThreshold) || freeThreshold < 0)) {
      toast.error('Free delivery threshold must be 0 or greater')
      return
    }
    const flatShipping = parseFloat(settings.flat_shipping_rate || '0')
    if (settings.flat_shipping_rate !== undefined && (isNaN(flatShipping) || flatShipping < 0)) {
      toast.error('Flat shipping rate must be 0 or greater')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) throw new Error()
      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const whatsappUrl = settings.whatsapp_number ? `https://wa.me/${settings.whatsapp_number}` : ''

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 space-y-4 shadow-sm">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-9 animate-pulse rounded-lg bg-gray-100" />
              <div className="h-9 animate-pulse rounded-lg bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Site Settings"
        description="Manage business information, shipping rates, and branding"
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save All'}
          </button>
        }
      />

      {/* Business Information */}
      <SectionCard
        title="Business Information"
        actions={<Building2 className="h-4 w-4 text-gray-400" />}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SettingField label="Site Name">
              <SettingInput value={settings.site_name || ''} onChange={(v) => set('site_name', v)} placeholder="Speedy Print Suite" />
            </SettingField>
            <SettingField label="Tagline">
              <SettingInput value={settings.site_tagline || ''} onChange={(v) => set('site_tagline', v)} placeholder="Custom Stickers & Labels" />
            </SettingField>
          </div>
          <SettingField label="Address">
            <SettingInput value={settings.company_address || ''} onChange={(v) => set('company_address', v)} placeholder="13 Langwa Street, Strydompark, Randburg" />
          </SettingField>
          <div className="grid grid-cols-2 gap-4">
            <SettingField label="Phone">
              <SettingInput value={settings.company_phone || ''} onChange={(v) => set('company_phone', v)} placeholder="011 027 1811" type="tel" />
            </SettingField>
            <SettingField label="Email">
              <SettingInput value={settings.company_email || ''} onChange={(v) => set('company_email', v)} placeholder="info@speedylabels.co.za" type="email" />
            </SettingField>
          </div>
        </div>
      </SectionCard>

      {/* WhatsApp */}
      <SectionCard
        title="WhatsApp"
        actions={<MessageCircle className="h-4 w-4 text-green-500" />}
      >
        <SettingField label="Number (international format, no + sign)" hint={whatsappUrl ? `Preview: wa.me/${settings.whatsapp_number}` : undefined}>
          <SettingInput value={settings.whatsapp_number || ''} onChange={(v) => set('whatsapp_number', v)} placeholder="27123456789" />
        </SettingField>
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-green-600 underline underline-offset-2">
            Test link →
          </a>
        )}
      </SectionCard>

      {/* Tax & Shipping */}
      <SectionCard
        title="Tax & Shipping"
        actions={<Truck className="h-4 w-4 text-gray-400" />}
      >
        <div className="grid grid-cols-3 gap-4">
          <SettingField label="VAT Rate" hint="Decimal — e.g. 0.15 = 15%">
            <SettingInput value={settings.vat_rate || ''} onChange={(v) => set('vat_rate', v)} placeholder="0.15" type="number" step="0.01" />
          </SettingField>
          <SettingField label="Free Delivery Over (R)" hint="0 to disable">
            <SettingInput value={settings.free_delivery_threshold || ''} onChange={(v) => set('free_delivery_threshold', v)} placeholder="500" type="number" />
          </SettingField>
          <SettingField label="Flat Shipping Rate (R)">
            <SettingInput value={settings.flat_shipping_rate || ''} onChange={(v) => set('flat_shipping_rate', v)} placeholder="85" type="number" />
          </SettingField>
        </div>
      </SectionCard>

      {/* Social Media */}
      <SectionCard
        title="Social Media"
        actions={<Globe className="h-4 w-4 text-gray-400" />}
      >
        <div className="space-y-4">
          <SettingField label="Facebook URL">
            <SettingInput value={settings.social_facebook || ''} onChange={(v) => set('social_facebook', v)} placeholder="https://facebook.com/speedylabels" type="url" />
          </SettingField>
          <SettingField label="Instagram URL">
            <SettingInput value={settings.social_instagram || ''} onChange={(v) => set('social_instagram', v)} placeholder="https://instagram.com/speedylabels" type="url" />
          </SettingField>
          <SettingField label="Twitter / X URL">
            <SettingInput value={settings.social_twitter || ''} onChange={(v) => set('social_twitter', v)} placeholder="https://x.com/speedylabels" type="url" />
          </SettingField>
        </div>
      </SectionCard>

      {/* Branding */}
      <SectionCard
        title="Branding"
        actions={<Palette className="h-4 w-4 text-gray-400" />}
      >
        <SettingField label="Logo">
          <ImageUploader
            value={settings.logo_url ? [settings.logo_url] : []}
            onChange={(urls) => set('logo_url', urls[0] || '')}
            maxImages={1}
            folder="branding"
          />
        </SettingField>
      </SectionCard>

      {/* Currency (read-only) */}
      <SectionCard
        title="Currency"
        actions={<DollarSign className="h-4 w-4 text-gray-400" />}
      >
        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">Default Currency</p>
            <p className="text-xs text-gray-400">South African Rand — cannot be changed</p>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">R (ZAR)</span>
        </div>
      </SectionCard>
    </div>
  )
}
