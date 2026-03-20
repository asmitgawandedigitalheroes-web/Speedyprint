'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { useAuth } from '@/hooks/useAuth'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  // Wait for Zustand persist to rehydrate from localStorage before checking auth
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (user && user.role !== 'admin' && user.role !== 'production_staff') {
      router.replace('/')
    }
  }, [hydrated, isAuthenticated, user, router])

  // Show nothing while Zustand is hydrating or while redirecting
  if (
    !hydrated ||
    !isAuthenticated ||
    !user ||
    (user.role !== 'admin' && user.role !== 'production_staff')
  ) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  )
}
