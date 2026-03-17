'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver
    </button>
  )
}
