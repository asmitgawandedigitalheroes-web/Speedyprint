'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils/format'
import type { Profile, UserRole } from '@/types'

interface UserWithOrderCount extends Profile {
  order_count: number
}

const ROLES: { value: UserRole | ''; label: string }[] = [
  { value: '', label: 'All Roles' },
  { value: 'customer', label: 'Customer' },
  { value: 'admin', label: 'Admin' },
  { value: 'production_staff', label: 'Production Staff' },
]

const ROLE_COLORS: Record<UserRole, string> = {
  customer: 'bg-gray-100 text-gray-700',
  admin: 'bg-red-100 text-red-700',
  production_staff: 'bg-purple-100 text-purple-700',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithOrderCount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
        })
        if (search) params.set('search', search)
        if (roleFilter && roleFilter !== '_all') params.set('role', roleFilter)

        const res = await fetch(`/api/admin/users?${params}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()

        setUsers(data.users ?? [])
        setTotalPages(data.totalPages ?? 1)
        setTotal(data.total ?? 0)
      } catch (err) {
        console.error('Users fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchUsers, 300)
    return () => clearTimeout(debounce)
  }, [search, roleFilter, page])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-text flex items-center gap-2">
          <Users className="h-6 w-6" />
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage user accounts, roles, and view their order history
          {!loading && ` \u2014 ${total} total users`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={roleFilter || '_all'}
          onValueChange={(val) => {
            setRoleFilter(val === '_all' ? '' : val)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role.value || '_all'} value={role.value || '_all'}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Company</th>
              <th className="px-4 py-3 text-left font-medium">Phone</th>
              <th className="px-4 py-3 text-center font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-center font-medium">Orders</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td colSpan={8} className="px-4 py-4">
                    <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex items-center gap-3 hover:text-brand-primary"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {user.full_name
                          ? user.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          : '?'}
                      </div>
                      <span className="font-medium">
                        {user.full_name ?? 'Unnamed'}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.company_name ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.phone ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="secondary"
                      className={ROLE_COLORS[user.role]}
                    >
                      {ROLES.find((r) => r.value === user.role)?.label ??
                        user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="secondary">{user.order_count}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/admin/users/${user.id}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
