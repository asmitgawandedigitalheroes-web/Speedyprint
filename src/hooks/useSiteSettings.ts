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

// Module-level promise deduplication — if multiple components mount at the
// same time and all see cachedSettings === null, they share one fetch instead
// of each firing their own request.
let inflightFetch: Promise<Record<string, string>> | null = null

/** Live pricing values — updated from DB settings on first fetch, fallback to constants */
export const livePricing = {
  vatRate: VAT_RATE,
  freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  flatShippingRate: FLAT_SHIPPING_RATE,
}

function applyPricingOverrides(settings: Record<string, string>) {
  if (settings.vat_rate) livePricing.vatRate = parseFloat(settings.vat_rate) || VAT_RATE
  if (settings.free_delivery_threshold) livePricing.freeDeliveryThreshold = parseFloat(settings.free_delivery_threshold) || FREE_DELIVERY_THRESHOLD
  if (settings.flat_shipping_rate) livePricing.flatShippingRate = parseFloat(settings.flat_shipping_rate) || FLAT_SHIPPING_RATE
}

function doFetch(): Promise<Record<string, string>> {
  if (inflightFetch) return inflightFetch
  inflightFetch = fetch('/api/settings')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json()
    })
    .then((data) => {
      cachedSettings = data.settings
      applyPricingOverrides(data.settings)
      return data.settings as Record<string, string>
    })
    .finally(() => {
      inflightFetch = null
    })
  return inflightFetch
}

export function useSiteSettings(): UseSiteSettingsReturn {
  const [settings, setSettings] = useState<Record<string, string>>(
    cachedSettings ?? {}
  )
  const [loading, setLoading] = useState(!cachedSettings)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      const result = await doFetch()
      setSettings(result)
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
