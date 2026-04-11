'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart, FileCheck, Factory, CheckCircle2,
  TrendingUp, Printer, AlertCircle, ArrowRight,
  Tag, Zap, Hash, Stamp, Trophy,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { DIVISIONS } from '@/lib/utils/constants'
import { StatCard, SectionCard } from '@/components/admin/AdminUI'

interface PipelineStages {
  quote: number; ordered: number; artwork: number
  proof: number; production: number; completed: number
}

interface DashboardStatsData {
  totalOrders: number; pendingProofs: number; inProduction: number
  completedToday: number; completedThisWeek: number; completedThisMonth: number
  readyForProduction: number; totalRevenue: number
  revenueThisMonth: number; revenueThisWeek: number
}

const DIVISION_ICONS: Record<string, React.ElementType> = {
  labels: Tag, laser: Zap, 'race-numbers': Hash, print: Stamp, trophies: Trophy,
}

const PIPELINE_STAGES = [
  { key: 'quote',      label: 'Quote',      dot: 'bg-gray-400',   text: 'text-gray-600',   badge: 'bg-gray-100 text-gray-700',   href: '/admin/orders?status=draft' },
  { key: 'ordered',    label: 'Ordered',    dot: 'bg-blue-500',   text: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700',   href: '/admin/orders?status=paid' },
  { key: 'artwork',    label: 'Artwork',    dot: 'bg-yellow-500', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700', href: '/admin/orders' },
  { key: 'proof',      label: 'Proof',      dot: 'bg-orange-500', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', href: '/admin/proofs' },
  { key: 'production', label: 'Production', dot: 'bg-purple-500', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', href: '/admin/production' },
  { key: 'completed',  label: 'Done',       dot: 'bg-green-500',  text: 'text-green-600',  badge: 'bg-green-100 text-green-700',  href: '/admin/orders?status=completed' },
] as const

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null)
  const [pipeline, setPipeline] = useState<PipelineStages | null>(null)
  const [divisionBreakdown, setDivisionBreakdown] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(data => { setStats(data.stats); setPipeline(data.pipeline); setDivisionBreakdown(data.divisionBreakdown ?? {}) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (error) return <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</div>

  const totalPipeline = pipeline ? Object.values(pipeline).reduce((s, v) => s + v, 0) : 0

  return (
    <div className="space-y-5">

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Link href="/admin/orders" className="xl:col-span-1">
          <StatCard label="Total Orders" value={loading ? '—' : (stats?.totalOrders ?? 0).toLocaleString()} sub="All time" icon={ShoppingCart} color="blue" loading={loading} />
        </Link>
        <Link href="/admin/production" className="xl:col-span-1">
          <StatCard label="Ready to Print" value={loading ? '—' : (stats?.readyForProduction ?? 0)} sub="Approved, awaiting files" icon={Printer} color="orange" loading={loading} />
        </Link>
        <Link href="/admin/proofs" className="xl:col-span-1">
          <StatCard label="Pending Proofs" value={loading ? '—' : (stats?.pendingProofs ?? 0)} sub="Need review" icon={FileCheck} color="yellow" loading={loading} />
        </Link>
        <Link href="/admin/orders?status=in_production" className="xl:col-span-1">
          <StatCard label="In Production" value={loading ? '—' : (stats?.inProduction ?? 0)} sub="Being manufactured" icon={Factory} color="purple" loading={loading} />
        </Link>
        <Link href="/admin/orders?status=completed" className="xl:col-span-1">
          <StatCard label="Done Today" value={loading ? '—' : (stats?.completedToday ?? 0)} sub={`${stats?.completedThisWeek ?? 0} this week`} icon={CheckCircle2} color="green" loading={loading} />
        </Link>
        <Link href="/admin/orders" className="xl:col-span-1">
          <StatCard label="Revenue (Month)" value={loading ? '—' : formatCurrency(stats?.revenueThisMonth ?? 0)} sub={`${formatCurrency(stats?.revenueThisWeek ?? 0)} this week`} icon={TrendingUp} color="green" loading={loading} />
        </Link>
      </div>

      {/* ── Pipeline ── */}
      <SectionCard title="Order Pipeline" noPad>
        <div className="overflow-x-auto">
          <div className="flex min-w-max">
            {PIPELINE_STAGES.map((stage, idx) => {
              const count = pipeline?.[stage.key as keyof PipelineStages] ?? 0
              const pct = totalPipeline > 0 ? Math.round((count / totalPipeline) * 100) : 0
              const isLast = idx === PIPELINE_STAGES.length - 1
              return (
                <div key={stage.key} className="flex items-center">
                  <Link
                    href={stage.href}
                    className={cn(
                      'group flex min-w-[100px] flex-col items-center gap-2 px-5 py-4 transition-colors hover:bg-gray-50',
                      idx === 0 ? 'rounded-bl-xl' : '',
                      isLast ? 'rounded-br-xl' : ''
                    )}
                  >
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-transform group-hover:scale-105', stage.badge)}>
                      {loading ? <div className="h-4 w-4 animate-pulse rounded-full bg-current opacity-20" /> : count}
                    </div>
                    <span className="text-xs font-medium text-gray-500">{stage.label}</span>
                    {!loading && totalPipeline > 0 && (
                      <div className="flex items-center gap-1">
                        <div className={cn('h-1.5 w-1.5 rounded-full', stage.dot)} />
                        <span className="text-[10px] text-gray-400">{pct}%</span>
                      </div>
                    )}
                  </Link>
                  {!isLast && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-200" />}
                </div>
              )
            })}
          </div>
          {/* Progress bar */}
          {pipeline && totalPipeline > 0 && (
            <div className="flex h-1.5 overflow-hidden rounded-b-xl">
              {PIPELINE_STAGES.map((stage) => {
                const count = pipeline[stage.key as keyof PipelineStages] ?? 0
                const pct = (count / totalPipeline) * 100
                if (pct === 0) return null
                return <div key={stage.key} className={cn('h-full transition-all', stage.dot)} style={{ width: `${pct}%` }} />
              })}
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Division Breakdown ── */}
      {Object.keys(divisionBreakdown).some(k => divisionBreakdown[k] > 0) && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Active Orders by Division</p>
          <div className="flex flex-wrap gap-2">
            {DIVISIONS.map((div) => {
              const count = divisionBreakdown[div.key] ?? 0
              if (count === 0) return null
              const Icon = DIVISION_ICONS[div.key] ?? ShoppingCart
              return (
                <Link
                  key={div.key}
                  href={`/admin/orders?division=${div.key}`}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
                >
                  <Icon className="h-3.5 w-3.5 text-gray-500" />
                  <span className="font-medium text-gray-700">{div.name}</span>
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold text-gray-600">{count}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
