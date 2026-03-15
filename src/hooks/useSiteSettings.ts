'use client'

import { useEffect, useState } from 'react'

interface UseSiteSettingsReturn {
  settings: Record<string, string>
  loading: boolean
  error: string | null
  refresh: () => void
}

let cachedSettings: Record<string, string> | null = null

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
