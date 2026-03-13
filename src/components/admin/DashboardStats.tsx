'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingCart,
  FileCheck,
  Factory,
  CheckCircle,
  DollarSign,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'

interface DashboardStatsData {
  totalOrders: number
  pendingProofs: number
  inProduction: number
  completedToday: number
  totalRevenue: number
}

const STAT_CARDS = [
  {
    key: 'totalOrders' as const,
    label: 'Total Orders',
    icon: ShoppingCart,
    color: 'text-blue-600 bg-blue-50',
    format: 'number' as const,
  },
  {
    key: 'pendingProofs' as const,
    label: 'Pending Proofs',
    icon: FileCheck,
    color: 'text-yellow-600 bg-yellow-50',
    format: 'number' as const,
  },
  {
    key: 'inProduction' as const,
    label: 'In Production',
    icon: Factory,
    color: 'text-purple-600 bg-purple-50',
    format: 'number' as const,
  },
  {
    key: 'completedToday' as const,
    label: 'Completed Today',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50',
    format: 'number' as const,
  },
  {
    key: 'totalRevenue' as const,
    label: 'Total Revenue',
    icon: DollarSign,
    color: 'text-emerald-600 bg-emerald-50',
    format: 'currency' as const,
  },
]

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        setStats(data.stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {STAT_CARDS.map((card) => {
        const Icon = card.icon
        const value = stats?.[card.key] ?? 0

        return (
          <Card key={card.key}>
            <CardContent className="flex items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                {loading ? (
                  <div className="mt-1 h-7 w-16 animate-pulse rounded bg-gray-200" />
                ) : (
                  <p className="text-2xl font-bold">
                    {card.format === 'currency'
                      ? formatCurrency(value)
                      : value.toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
