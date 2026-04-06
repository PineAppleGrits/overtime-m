'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { removePlayerFromTeamAction } from '@/modules/profile/actions/teamActions'

interface RemovePlayerButtonProps {
  teamId: string
  profileId: string
  playerName: string
}

export function RemovePlayerButton({ teamId, profileId, playerName }: RemovePlayerButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await removePlayerFromTeamAction(teamId, profileId)
      if (result.success) {
        toast.success(`${playerName} fue quitado del equipo`)
        setOpen(false)
      } else {
        toast.error(result.error ?? 'No se pudo quitar al jugador')
      }
    })
  }

  return (
    <>
      <button
        title="Quitar del equipo"
        className="text-[#4E4585] hover:text-red-400 transition-colors cursor-pointer"
        onClick={() => setOpen(true)}
        disabled={isPending}
      >
        <Trash2 className="h-3 w-3" />
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Quitar jugador"
        description={`¿Estás seguro de que querés quitar a ${playerName} del equipo?`}
        confirmLabel="Quitar"
        variant="destructive"
        onConfirm={handleConfirm}
        loading={isPending}
      />
    </>
  )
}
