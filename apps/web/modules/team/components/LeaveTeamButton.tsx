'use client'

import { useState, useTransition } from 'react'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { leaveTeamAction } from '@/modules/profile/actions/teamActions'
import { useRouter } from 'next/navigation'

interface Props {
  teamId: string
  /** Modo compacto para listas (ej: /profile/equipos) */
  compact?: boolean
}

export function LeaveTeamButton({ teamId, compact = false }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleLeave() {
    startTransition(async () => {
      const result = await leaveTeamAction(teamId)
      if (result.success) {
        toast.success('Abandonaste el equipo')
        router.refresh()
      } else {
        toast.error(result.error ?? 'No se pudo abandonar el equipo')
        setConfirming(false)
      }
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/8 px-3 py-2">
        <span className="text-xs text-red-300/80">¿Confirmás que querés abandonar?</span>
        <button
          onClick={handleLeave}
          disabled={isPending}
          className="rounded px-2 py-0.5 text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saliendo...' : 'Sí, abandonar'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="rounded px-2 py-0.5 text-xs text-white/50 hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </div>
    )
  }

  if (compact) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1 text-[11px] text-red-400/40 hover:text-red-400 transition-colors"
      >
        <LogOut className="size-3" />
        Abandonar equipo
      </button>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
    >
      <LogOut className="size-3.5" />
      Abandonar equipo
    </button>
  )
}
