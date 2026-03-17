'use client'

import { hasAdminRole } from '@/lib/auth/hasAdminRole'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'ot_notif_seen_at'

interface NotifItem {
  id: string
  title: string
  description: string
  href: string
  createdAt: string
  status: string
}

interface Props {
  /** 'light' for dark backgrounds (main site header), 'dark' for light backgrounds (admin header) */
  variant?: 'light' | 'dark'
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente de aprobación',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
}

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  cancelled: 'bg-gray-300',
}

function normalizeResponse(raw: unknown, isAdmin: boolean): NotifItem[] {
  const obj = raw as { data?: unknown[] }
  const arr: unknown[] = Array.isArray(raw) ? raw : (Array.isArray(obj?.data) ? obj.data : [])

  return arr.map((r) => {
    const reg = r as {
      id: string
      teamName?: string
      tournamentName?: string
      categoryName?: string
      status?: string
      createdAt?: string
    }
    const status = reg.status ?? 'pending'
    const tournament = reg.tournamentName ?? 'un torneo'
    const team = reg.teamName ?? 'Equipo'
    const category = reg.categoryName ? ` · ${reg.categoryName}` : ''

    return {
      id: reg.id,
      title: isAdmin ? team : `Inscripción ${STATUS_LABEL[status]?.toLowerCase() ?? status}`,
      description: `${tournament}${category}`,
      href: isAdmin ? '/admin/inscripciones' : '/profile',
      createdAt: reg.createdAt ?? new Date().toISOString(),
      status,
    }
  })
}

export function NotificationBell({ variant = 'dark' }: Props) {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  // Lazy initializer — runs once on mount, reads localStorage synchronously (safe in 'use client')
  const [lastSeenAt, setLastSeenAt] = useState<number>(() => {
    if (typeof localStorage === 'undefined') return 0 // In case localStorage is not available (shouldn't happen in a browser environment)
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? parseInt(stored, 10) : 0
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const isAdmin = !!profile && hasAdminRole(profile)

  // Close on outside click — useEffect is appropriate here (DOM event listener with cleanup)
  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['notifications', isAdmin, profile?.id],
    queryFn: async () => {
      const params = isAdmin
        ? { status: 'pending', limit: 20 }
        : { limit: 20 }
      //const raw = await registrationBrowserService.getRegistrations(params)
      //return normalizeResponse(raw, isAdmin)
      return [] as Array<NotifItem>
    },
    enabled: !!profile,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  const hasUnread = items.some((n) => new Date(n.createdAt).getTime() > lastSeenAt)

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        const now = Date.now()
        localStorage.setItem(STORAGE_KEY, String(now))
        setLastSeenAt(now)
      }
      return !prev
    })
  }, [])

  if (!profile) return null

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        aria-label="Notificaciones"
        aria-expanded={open}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-lg transition-all',
          variant === 'light'
            ? 'text-white/65 hover:text-white hover:bg-white/10'
            : 'text-[#6b6a72] hover:text-[#0f0e13] hover:bg-[#f0ede8]'
        )}
      >
        <Bell className="h-5 w-5" />
        {/* Red dot — only shown when there are unread items */}
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-ot-orange ring-2 ring-white/80" />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            'absolute right-0 top-11 mt-2 z-50 w-80 rounded-xl overflow-hidden',
            'bg-[#1a1730] shadow-xl ring-1 ring-white/10',
            'animate-in fade-in-0 slide-in-from-top-2 duration-150'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-xs text-white/50 uppercase tracking-wider">Notificaciones</p>
              {items.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/10 px-1.5 text-[10px] font-semibold text-white/60">
                  {items.length}
                </span>
              )}
            </div>
            {isAdmin && items.length > 0 && (
              <Link
                href="/admin/inscripciones"
                onClick={() => setOpen(false)}
                className="text-[11px] text-[#ff3b2f]/80 font-medium hover:text-[#ff3b2f] transition-colors"
              >
                Ver todas
              </Link>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[340px] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col gap-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 py-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/8">
                  <Bell className="h-5 w-5 text-white/25" />
                </div>
                <p className="text-[13px] font-medium text-white/50">No hay notificaciones</p>
                <p className="text-[11px] text-white/30 text-center px-6">
                  Acá aparecerán novedades sobre la plataforma.
                </p>
              </div>
            ) : (
              <ul>
                {items.map((item, idx) => {
                  const isNew = new Date(item.createdAt).getTime() > lastSeenAt
                  const dotClass = STATUS_DOT[item.status] ?? 'bg-white/20'

                  return (
                    <li key={item.id} className={cn(idx > 0 && 'border-t border-white/8')}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5',
                          isNew && 'bg-white/4'
                        )}
                      >
                        <span className={cn('mt-[5px] h-2 w-2 rounded-full shrink-0', dotClass)} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-[12px] leading-snug truncate',
                            isNew ? 'font-semibold text-white' : 'font-medium text-white/70'
                          )}>
                            {item.title}
                          </p>
                          <p className="text-[11px] text-white/40 mt-0.5 truncate">
                            {item.description}
                          </p>
                          <p className="text-[10px] text-white/25 mt-1">
                            {new Date(item.createdAt).toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {isNew && (
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#ff3b2f] shrink-0" />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer (admin only) */}
          {isAdmin && items.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2.5">
              <p className="text-[11px] text-white/30">
                {items.length === 1
                  ? '1 inscripción pendiente de aprobación'
                  : `${items.length} inscripciones pendientes de aprobación`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
