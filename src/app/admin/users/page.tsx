'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/format'
import {
  PageHeader, SectionCard, FilterTabs, SearchInput,
  EmptyState, StatusBadge, SkeletonRows, Pagination,
} from '@/components/admin/AdminUI'
import type { Profile, UserRole } from '@/types'

interface UserWithOrderCount extends Profile {
  order_count: number
}

type RoleFilter = '' | UserRole

const ROLES: { value: RoleFilter; label: string }[] = [
  { value: '', label: 'All Users' },
  { value: 'customer', label: 'Customer' },
  { value: 'admin', label: 'Admin' },
  { value: 'production_staff', label: 'Production' },
]

const ROLE_COLOR: Record<string, 'gray' | 'red' | 'purple' | 'blue'> = {
  customer: 'gray',
  admin: 'red',
  production_staff: 'purple',
}

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  admin: 'Admin',
  production_staff: 'Production',
}

function getInitials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithOrderCount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' })
        if (search) params.set('search', search)
        if (roleFilter) params.set('role', roleFilter)
        const res = await fetch(`/api/admin/users?${params}`)
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setUsers(data.users ?? [])
        setTotalPages(data.totalPages ?? 1)
        setTotal(data.total ?? 0)
      } catch {
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, roleFilter, page])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={`Manage accounts, roles, and order history${!loading ? ` — ${total} total` : ''}`}
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search by name, email, or company..."
          className="flex-1 max-w-md"
        />
        <FilterTabs
          options={ROLES}
          value={roleFilter}
          onChange={(v) => { setRoleFilter(v); setPage(1) }}
        />
      </div>

      {/* Table */}
      <SectionCard noPad>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">User</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">Company</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 lg:table-cell">Phone</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Role</th>
                <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">Joined</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Orders</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={6} cols={7} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filter" />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 group">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                          {getInitials(user.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 group-hover:text-brand-primary transition-colors truncate">{user.full_name ?? 'Unnamed'}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email ?? '—'}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden px-5 py-3.5 text-xs text-gray-500 md:table-cell">
                      {user.company_name ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="hidden px-5 py-3.5 text-xs text-gray-500 lg:table-cell">
                      {user.phone ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge
                        label={ROLE_LABEL[user.role] ?? user.role}
                        color={ROLE_COLOR[user.role] ?? 'gray'}
                      />
                    </td>
                    <td className="hidden px-5 py-3.5 text-xs text-gray-400 sm:table-cell">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gray-100 px-2 text-[11px] font-semibold text-gray-600">
                        {user.order_count}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:border-brand-primary hover:text-brand-primary hover:bg-red-50 transition-colors"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPage={(p) => setPage(p)}
        />
      </SectionCard>
    </div>
  )
}
