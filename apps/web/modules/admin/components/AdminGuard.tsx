'use client'

import { hasAdminRole } from '@/lib/auth/hasAdminRole';
import { useAuth } from '@/providers/AuthProvider'
import { notFound } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f6f4] p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48 bg-[#e8e6e1]" />
            <Skeleton className="h-9 w-32 bg-[#e8e6e1]" />
          </div>
          <Skeleton className="h-10 w-full max-w-md bg-[#e8e6e1]" />
          <div className="rounded-xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
            <Skeleton className="h-5 w-1/3 bg-[#e8e6e1]" />
            <Skeleton className="h-4 w-full bg-[#e8e6e1]" />
            <Skeleton className="h-4 w-5/6 bg-[#e8e6e1]" />
            <Skeleton className="h-4 w-2/3 bg-[#e8e6e1]" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile || !hasAdminRole(profile)) {
    notFound()
  }

  return <>{children}</>
}
