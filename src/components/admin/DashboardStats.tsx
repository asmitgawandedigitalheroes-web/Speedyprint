'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  FileCheck,
  Factory,
  CheckCircle,
  TrendingUp,
  Printer,
  AlertCircle,
  ArrowRight,
  Tag,
  Zap,
  Hash,
  Stamp,
  Trophy,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { DIVISIONS } from '@/lib/utils/constants'

interface PipelineStages {
  quote: number
  ordered: number
  artwork: number
  proof: number
  production: number
  completed: number
}

interface DashboardStatsData {
  totalOrders: number
  pendingProofs: number
  inProduction: number
  completedToday: number
  completedThisWeek: number
  completedThisMonth: number
  readyForProduction: number
  totalRevenue: number
  revenueThisMonth: number
  revenueThisWeek: number
}

const DIVISION_ICONS: Record<string, React.ElementType> = {
  labels: Tag,
  laser: Zap,
  events: Hash,
  stamps: Stamp,
  sleeves: Trophy,
}

const PIPELINE_STAGES = [
  { key: 'quote',      label: 'Quote',      color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  { key: 'ordered',    label: 'Ordered',    color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  { key: 'artwork',    label: 'Artwork',    color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  { key: 'proof',      label: 'Proof',      color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { key: 'production', label: 'Production', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { key: 'completed',  label: 'Completed',  color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
] as const

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null)
  const [pipeline, setPipeline] = useState<PipelineStages | null>(null)
  const [divisionBreakdown, setDivisionBreakdown] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        setStats(data.stats)
        setPipeline(data.pipeline)
        setDivisionBreakdown(data.divisionBreakdown ?? {})
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

  const totalPipeline = pipeline
    ? Object.values(pipeline).reduce((s, v) => s + v, 0)
    : 0

  return (
    <div className="space-y-6">
      {/* ── Pipeline Stage Bar ──────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Production Pipeline
        </h2>
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-stretch gap-0 rounded-xl border bg-white shadow-sm">
            {PIPELINE_STAGES.map((stage, idx) => {
              const count = pipeline?.[stage.key] ?? 0
              const pct = totalPipeline > 0 ? Math.round((count / totalPipeline) * 100) : 0
              const isLast = idx === PIPELINE_STAGES.length - 1
              return (
                <div key={stage.key} className="flex items-center">
                  <Link
                    href={stage.key === 'quote' ? '/admin/orders?status=draft' :
                          stage.key === 'ordered' ? '/admin/orders?status=paid' :
                          stage.key === 'artwork' ? '/admin/orders?ready_for_production=false' :
                          stage.key === 'proof' ? '/admin/proofs' :
                          stage.key === 'production' ? '/admin/production' :
                          '/admin/orders?status=completed'}
                    className={cn(
                      'flex min-w-[110px] flex-col items-center gap-1.5 px-5 py-4 transition-colors hover:bg-gray-50',
                      idx === 0 ? 'rounded-l-xl' : '',
                      isLast ? 'rounded-r-xl' : ''
                    )}
                  >
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold', stage.color)}>
                      {loading ? <div className="h-4 w-4 animate-pulse rounded bg-current opacity-30" /> : count}
                    </div>
                    <span className="text-xs font-medium text-gray-700">{stage.label}</span>
                    {!loading && totalPipeline > 0 && (
                      <span className="text-[10px] text-muted-foreground">{pct}%</span>
                    )}
                  </Link>
                  {!isLast && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {[
          {
            label: 'Total Orders',
            value: stats?.totalOrders ?? 0,
            sub: 'All time',
            icon: ShoppingCart,
            color: 'text-blue-600 bg-blue-50',
            format: 'number' as const,
            href: '/admin/orders',
          },
          {
            label: 'Ready for Production',
            value: stats?.readyForProduction ?? 0,
            sub: 'Proofs approved',
            icon: Printer,
            color: 'text-orange-600 bg-orange-50',
            format: 'number' as const,
            href: '/admin/production',
            highlight: (stats?.readyForProduction ?? 0) > 0,
          },
          {
            label: 'Pending Proofs',
            value: stats?.pendingProofs ?? 0,
            sub: 'Awaiting review',
            icon: FileCheck,
            color: 'text-yellow-600 bg-yellow-50',
            format: 'number' as const,
            href: '/admin/proofs',
            highlight: (stats?.pendingProofs ?? 0) > 0,
          },
          {
            label: 'In Production',
            value: stats?.inProduction ?? 0,
            sub: 'Being manufactured',
            icon: Factory,
            color: 'text-purple-600 bg-purple-50',
            format: 'number' as const,
            href: '/admin/orders?status=in_production',
          },
          {
            label: 'Completed Today',
            value: stats?.completedToday ?? 0,
            sub: `${stats?.completedThisWeek ?? 0} this week`,
            icon: CheckCircle,
            color: 'text-green-600 bg-green-50',
            format: 'number' as const,
            href: '/admin/orders?status=completed',
          },
          {
            label: 'Revenue (Month)',
            value: stats?.revenueThisMonth ?? 0,
            sub: `${formatCurrency(stats?.revenueThisWeek ?? 0)} this week`,
            icon: TrendingUp,
            color: 'text-emerald-600 bg-emerald-50',
            format: 'currency' as const,
            href: '/admin/orders',
          },
        ].map((card) => {
          const Icon = card.icon
          const value = card.value ?? 0
          return (
            <Link key={card.label} href={card.href ?? '#'}>
              <Card
                className={cn(
                  'cursor-pointer transition-shadow hover:shadow-md',
                  card.highlight ? 'border-orange-200 bg-orange-50/30' : ''
                )}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${card.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    {loading ? (
                      <div className="mt-1 h-6 w-14 animate-pulse rounded bg-gray-200" />
                    ) : (
                      <p className="text-xl font-bold leading-tight">
                        {card.format === 'currency'
                          ? formatCurrency(value)
                          : value.toLocaleString()}
                      </p>
                    )}
                    {!loading && card.sub && (
                      <p className="text-[11px] text-muted-foreground">{card.sub}</p>
                    )}
                  </div>
                  {card.highlight && (
                    <AlertCircle className="ml-auto h-4 w-4 shrink-0 text-orange-500" />
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* ── Division Breakdown ────────────────────────────────────────────────── */}
      {Object.keys(divisionBreakdown).length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            By Division
          </h2>
          <div className="flex flex-wrap gap-3">
            {DIVISIONS.map((div) => {
              const count = divisionBreakdown[div.key] ?? 0
              if (count === 0) return null
              const Icon = DIVISION_ICONS[div.key] ?? ShoppingCart
              return (
                <Link key={div.key} href={`/admin/orders?division=${div.key}`}>
                  <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm transition-shadow hover:shadow-sm">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{div.name}</span>
                    <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                      {count}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
