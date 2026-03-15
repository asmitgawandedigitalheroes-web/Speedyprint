'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSettings(data.settings || {})
    } catch (err) {
      console.error('Settings fetch error:', err)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const whatsappUrl = settings.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number}`
    : ''

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your business information, shipping, and branding
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save All'}
        </Button>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                value={settings.site_name || ''}
                onChange={(e) => updateSetting('site_name', e.target.value)}
                placeholder="SpeedyPrint"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_tagline">Tagline</Label>
              <Input
                id="site_tagline"
                value={settings.site_tagline || ''}
                onChange={(e) => updateSetting('site_tagline', e.target.value)}
                placeholder="Custom Stickers & Labels"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_address">Address</Label>
            <Input
              id="company_address"
              value={settings.company_address || ''}
              onChange={(e) => updateSetting('company_address', e.target.value)}
              placeholder="Cape Town, South Africa"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_phone">Phone</Label>
              <Input
                id="company_phone"
                value={settings.company_phone || ''}
                onChange={(e) => updateSetting('company_phone', e.target.value)}
                placeholder="+27 12 345 6789"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_email">Email</Label>
              <Input
                id="company_email"
                value={settings.company_email || ''}
                onChange={(e) => updateSetting('company_email', e.target.value)}
                placeholder="info@speedyprint.co.za"
                type="email"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-green-600" />
            WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">
              WhatsApp Number (international format, no + sign)
            </Label>
            <Input
              id="whatsapp_number"
              value={settings.whatsapp_number || ''}
              onChange={(e) => updateSetting('whatsapp_number', e.target.value)}
              placeholder="27123456789"
            />
            {whatsappUrl && (
              <p className="text-xs text-muted-foreground">
                Preview:{' '}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 underline"
                >
                  {whatsappUrl}
                </a>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tax & Shipping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax & Shipping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vat_rate">VAT Rate</Label>
              <Input
                id="vat_rate"
                value={settings.vat_rate || ''}
                onChange={(e) => updateSetting('vat_rate', e.target.value)}
                placeholder="0.15"
                type="number"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                As decimal (e.g., 0.15 = 15%)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="free_delivery_threshold">
                Free Delivery Over (R)
              </Label>
              <Input
                id="free_delivery_threshold"
                value={settings.free_delivery_threshold || ''}
                onChange={(e) =>
                  updateSetting('free_delivery_threshold', e.target.value)
                }
                placeholder="500"
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flat_shipping_rate">Flat Shipping (R)</Label>
              <Input
                id="flat_shipping_rate"
                value={settings.flat_shipping_rate || ''}
                onChange={(e) =>
                  updateSetting('flat_shipping_rate', e.target.value)
                }
                placeholder="85"
                type="number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="social_facebook">Facebook URL</Label>
            <Input
              id="social_facebook"
              value={settings.social_facebook || ''}
              onChange={(e) =>
                updateSetting('social_facebook', e.target.value)
              }
              placeholder="https://facebook.com/speedyprint"
              type="url"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="social_instagram">Instagram URL</Label>
            <Input
              id="social_instagram"
              value={settings.social_instagram || ''}
              onChange={(e) =>
                updateSetting('social_instagram', e.target.value)
              }
              placeholder="https://instagram.com/speedyprint"
              type="url"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="social_twitter">Twitter / X URL</Label>
            <Input
              id="social_twitter"
              value={settings.social_twitter || ''}
              onChange={(e) =>
                updateSetting('social_twitter', e.target.value)
              }
              placeholder="https://x.com/speedyprint"
              type="url"
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              value={settings.logo_url || ''}
              onChange={(e) => updateSetting('logo_url', e.target.value)}
              placeholder="/images/logo.png"
            />
          </div>
        </CardContent>
      </Card>

      {/* Currency Info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Currency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Default Currency</p>
              <p className="text-xs text-muted-foreground">
                South African Rand
              </p>
            </div>
            <span className="text-lg font-bold">R (ZAR)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
