'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

/* ─────────────────────────────────────────
   Page Header
───────────────────────────────────────── */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Stat Card
───────────────────────────────────────── */
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = 'red',
  loading,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'gray'
  loading?: boolean
}) {
  const colors = {
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100'    },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100'   },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100'  },
    yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    gray:   { bg: 'bg-gray-50',   icon: 'text-gray-600',   border: 'border-gray-100'   },
  }
  const c = colors[color]

  return (
    <div className={cn('rounded-xl border bg-white p-5 shadow-sm', c.border)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded bg-gray-100" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          )}
          {sub && !loading && (
            <p className="mt-1 text-xs text-gray-400">{sub}</p>
          )}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', c.bg)}>
          <Icon className={cn('h-5 w-5', c.icon)} />
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Section Card (wrapper)
───────────────────────────────────────── */
export function SectionCard({
  title,
  actions,
  children,
  className,
  noPad,
}: {
  title?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  noPad?: boolean
}) {
  return (
    <div className={cn('rounded-xl border border-gray-100 bg-white shadow-sm', className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPad ? '' : 'p-5'}>{children}</div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Empty State
───────────────────────────────────────── */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-7 w-7 text-gray-400" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-700">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-gray-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ─────────────────────────────────────────
   Status Badge
───────────────────────────────────────── */
export function StatusBadge({
  label,
  color = 'gray',
}: {
  label: string
  color?: 'gray' | 'blue' | 'yellow' | 'orange' | 'green' | 'red' | 'purple'
}) {
  const colors = {
    gray:   'bg-gray-100 text-gray-600',
    blue:   'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    orange: 'bg-orange-100 text-orange-700',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold', colors[color])}>
      {label}
    </span>
  )
}

/* ─────────────────────────────────────────
   Filter Tabs (pill style)
───────────────────────────────────────── */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all',
            value === opt.value
              ? 'bg-brand-primary text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
              value === opt.value ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
            )}>
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────
   Search Input
───────────────────────────────────────── */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100 placeholder:text-gray-400"
      />
    </div>
  )
}

/* ─────────────────────────────────────────
   Skeleton Row (for table loading)
───────────────────────────────────────── */
export function SkeletonRows({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-5 py-3.5">
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" style={{ width: `${60 + (j * 10) % 30}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/* ─────────────────────────────────────────
   Pagination
───────────────────────────────────────── */
export function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number
  totalPages: number
  total: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
      <p className="text-xs text-gray-400">{total} total</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                p === page ? 'bg-brand-primary text-white' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
              )}
            >
              {p}
            </button>
          )
        })}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Action Button
───────────────────────────────────────── */
export function ActionBtn({
  onClick,
  icon: Icon,
  label,
  variant = 'ghost',
  danger,
  disabled,
}: {
  onClick: () => void
  icon: React.ElementType
  label: string
  variant?: 'ghost' | 'outline'
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50',
        danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
      )}
    >
      {disabled
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Icon className="h-3.5 w-3.5" />
      }
    </button>
  )
}
