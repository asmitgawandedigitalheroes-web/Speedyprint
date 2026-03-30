'use client'

import { useEffect, useState } from 'react'
import { VAT_RATE, FREE_DELIVERY_THRESHOLD, FLAT_SHIPPING_RATE } from '@/lib/utils/constants'

interface UseSiteSettingsReturn {
  settings: Record<string, string>
  loading: boolean
  error: string | null
  refresh: () => void
}

export let cachedSettings: Record<string, string> | null = null

/** Live pricing values — updated from DB settings on first fetch, fallback to constants */
export const livePricing = {
  vatRate: VAT_RATE,
  freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  flatShippingRate: FLAT_SHIPPING_RATE,
}

export function useSiteSettings(): UseSiteSettingsReturn {
  const [settings, setSettings] = useState<Record<string, string>>(
    cachedSettings ?? {}
  )
  const [loading, setLoading] = useState(!cachedSettings)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      cachedSettings = data.settings
      // Update live pricing from DB values
      if (data.settings.vat_rate) livePricing.vatRate = parseFloat(data.settings.vat_rate) || VAT_RATE
      if (data.settings.free_delivery_threshold) livePricing.freeDeliveryThreshold = parseFloat(data.settings.free_delivery_threshold) || FREE_DELIVERY_THRESHOLD
      if (data.settings.flat_shipping_rate) livePricing.flatShippingRate = parseFloat(data.settings.flat_shipping_rate) || FLAT_SHIPPING_RATE
      setSettings(data.settings)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!cachedSettings) {
      fetchSettings()
    }
  }, [])

  return {
    settings,
    loading,
    error,
    refresh: fetchSettings,
  }
}
