'use client'

import { useState, useTransition } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { addPlayerToTeamAction } from '@/modules/profile/actions/teamActions'
import availablePlayers from '@/mock/available-players.json'

interface AvailablePlayer {
  id: string
  name: string
  email: string
  documentNumber: string
}

interface AddPlayerDialogProps {
  teamId: string
  trigger: React.ReactNode
}

export function AddPlayerDialog({ teamId, trigger }: AddPlayerDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered: AvailablePlayer[] = search.trim().length > 0
    ? (availablePlayers as AvailablePlayer[]).filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.email.toLowerCase().includes(search.toLowerCase()),
      )
    : []

  function handleAdd(player: AvailablePlayer) {
    startTransition(async () => {
      const result = await addPlayerToTeamAction(teamId, player.id)
      if (result.success) {
        toast.success(`${player.name} fue agregado al equipo`)
        setSearch('')
        setOpen(false)
      } else {
        toast.error(result.error ?? 'No se pudo agregar al jugador')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-ot-dark-blue border-ot-light-blue/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white font-din-display">Agregar jugador</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por nombre o email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ot-light-blue/40 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-ot-orange/50"
          />
        </div>

        {filtered.length > 0 && (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {filtered.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between rounded-lg border border-ot-light-blue/30 bg-white/5 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-white">{player.name}</p>
                  <p className="text-xs text-white/40">{player.email}</p>
                </div>
                <button
                  onClick={() => handleAdd(player)}
                  disabled={isPending}
                  className="flex items-center gap-1 rounded-md bg-ot-orange hover:bg-ot-orange/90 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <UserPlus className="h-3 w-3" />
                  Agregar
                </button>
              </li>
            ))}
          </ul>
        )}

        {search.trim().length > 0 && filtered.length === 0 && (
          <p className="text-sm text-white/40 text-center py-4">
            No se encontraron jugadores
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
