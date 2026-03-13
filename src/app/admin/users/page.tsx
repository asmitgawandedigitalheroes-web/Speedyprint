'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'
import type { Profile, UserRole } from '@/types'

interface UserWithOrderCount extends Profile {
  order_count: number
}

const ROLES: { value: UserRole; label: string }[] = [
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
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      try {
        const supabase = createClient()

        let query = supabase
          .from('profiles')
          .select('*, orders:orders(id)')
          .order('created_at', { ascending: false })

        if (search) {
          query = query.or(
            `full_name.ilike.%${search}%,email.ilike.%${search}%`
          )
        }

        const { data, error } = await query

        if (error) throw error

        const usersWithCount = (data ?? []).map((user) => ({
          ...user,
          order_count: user.orders?.length ?? 0,
          orders: undefined,
        }))

        setUsers(usersWithCount)
      } catch (err) {
        console.error('Users fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [search])

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingRole(userId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    } catch (err) {
      console.error('Role update error:', err)
      alert('Failed to update role')
    } finally {
      setUpdatingRole(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage user accounts and roles
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Company</th>
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
                  <td colSpan={7} className="px-4 py-4">
                    <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
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
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.company_name ?? '-'}
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
                    {user.order_count}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Select
                      value={user.role}
                      onValueChange={(val) =>
                        handleRoleChange(user.id, val as UserRole)
                      }
                      disabled={updatingRole === user.id}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
