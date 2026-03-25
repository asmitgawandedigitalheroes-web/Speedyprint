'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  User,
  Package,
  Building2,
  Phone,
  MapPin,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { ORDER_STATUS_LABELS } from '@/lib/utils/constants'
import type { Profile, UserRole, OrderStatus } from '@/types'

interface UserOrder {
  id: string
  order_number: string
  status: OrderStatus
  total: number
  created_at: string
  paid_at: string | null
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'customer', label: 'Customer' },
  { value: 'admin', label: 'Admin' },
  { value: 'production_staff', label: 'Production Staff' },
]

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Editable form state
  const [form, setForm] = useState({
    full_name: '',
    company_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'South Africa',
    role: 'customer' as UserRole,
  })

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/admin/users/${id}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setProfile(data.profile)
        setOrders(data.orders ?? [])

        // Populate form
        const p = data.profile
        setForm({
          full_name: p.full_name ?? '',
          company_name: p.company_name ?? '',
          phone: p.phone ?? '',
          address_line1: p.address_line1 ?? '',
          address_line2: p.address_line2 ?? '',
          city: p.city ?? '',
          province: p.province ?? '',
          postal_code: p.postal_code ?? '',
          country: p.country ?? 'South Africa',
          role: p.role ?? 'customer',
        })
      } catch (err) {
        console.error('User fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        alert('Failed to save changes')
      }
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-lg bg-gray-200" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-700">User not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
      </Button>

      {/* User Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-lg font-bold text-brand-primary">
            {profile.full_name
              ? profile.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-text">
              {profile.full_name ?? 'Unnamed User'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile.email ?? 'No email'} &middot; Member since{' '}
              {formatDate(profile.created_at)}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : saved ? (
            <span className="text-green-200">Saved!</span>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => updateForm('full_name', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {profile.email ?? 'No email'}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(val) => updateForm('role', val)}
                  >
                    <SelectTrigger>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={form.company_name}
                  onChange={(e) => updateForm('company_name', e.target.value)}
                  placeholder="Company name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Address Line 1</Label>
                <Input
                  value={form.address_line1}
                  onChange={(e) => updateForm('address_line1', e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div className="space-y-2">
                <Label>Address Line 2</Label>
                <Input
                  value={form.address_line2}
                  onChange={(e) => updateForm('address_line2', e.target.value)}
                  placeholder="Apt, suite, unit (optional)"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => updateForm('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Province</Label>
                  <Input
                    value={form.province}
                    onChange={(e) => updateForm('province', e.target.value)}
                    placeholder="Province"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input
                    value={form.postal_code}
                    onChange={(e) => updateForm('postal_code', e.target.value)}
                    placeholder="Postal code"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => updateForm('country', e.target.value)}
                  placeholder="Country"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Stats + Quick Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Orders
                </span>
                <Badge variant="secondary" className="text-lg px-3">
                  {orders.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Spent
                </span>
                <span className="font-bold">
                  {formatCurrency(
                    orders.reduce((sum, o) => sum + (o.total ?? 0), 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Member Since
                </span>
                <span className="text-sm">
                  {formatDate(profile.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Orders ({orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No orders yet
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const statusInfo =
                      ORDER_STATUS_LABELS[order.status] ??
                      ORDER_STATUS_LABELS['draft']
                    return (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {order.order_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(order.total)}
                          </p>
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', statusInfo.color)}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
