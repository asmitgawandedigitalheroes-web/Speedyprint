'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (user && user.role !== 'admin' && user.role !== 'production_staff') {
      router.replace('/')
    }
  }, [isAuthenticated, user, router])

  // Show nothing while redirecting unauthenticated or unauthorized users
  if (
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
