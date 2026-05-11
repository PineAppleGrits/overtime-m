'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title: string
  description?: string
  className?: string
}

export function ErrorState({ title, description, className }: ErrorStateProps) {
  const router = useRouter()

  return (
    <div
      role="alert"
      className={
        className ??
        'flex flex-col items-center gap-3 rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 px-6 py-12 text-center'
      }
    >
      <AlertCircle className="size-8 text-red-400" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-white/80">{title}</p>
        {description && (
          <p className="text-xs text-white/50">{description}</p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.refresh()}
        className="border-ot-light-blue text-white/80 hover:bg-white/5"
      >
        Reintentar
      </Button>
    </div>
  )
}
