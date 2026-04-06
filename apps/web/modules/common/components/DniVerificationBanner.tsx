'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'

const STORAGE_KEY = 'dni-banner-dismissed'

export function DniVerificationBanner({ show }: { show: boolean }) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
      setDismissed(true)
    }
  }, [])

  if (!show || dismissed || !mounted) return null

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem(STORAGE_KEY, 'true')
  }

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/15 px-4 py-2.5"
    >
      <div className="flex items-center gap-2 text-sm text-amber-200">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p>
          Todavía no verificaste tu cuenta.{' '}
          <Link
            href="/profile"
            className="text-amber-300 underline hover:text-amber-100"
          >
            Verificá tu DNI
          </Link>{' '}
          para poder asociarte a equipos.
        </p>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Cerrar banner de verificación"
        className="shrink-0 text-amber-200/60 hover:text-amber-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
