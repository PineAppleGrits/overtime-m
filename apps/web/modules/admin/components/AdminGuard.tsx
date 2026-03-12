'use client'

import { hasAdminRole } from '@/lib/auth/hasAdminRole';
import { useAuth } from '@/providers/AuthProvider'
import { notFound } from 'next/navigation'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!profile || !hasAdminRole(profile)) {
    notFound()
  }

  return <>{children}</>
}
