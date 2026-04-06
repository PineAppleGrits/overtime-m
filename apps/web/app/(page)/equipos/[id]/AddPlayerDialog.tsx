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
import { addPlayerToTeamAction, searchUsersForTeamAction } from '@/modules/profile/actions/teamActions'
import type { UserSearchResult } from '@/modules/profile/actions/teamActions'

interface AddPlayerDialogProps {
  teamId: string
  trigger: React.ReactNode
}

export function AddPlayerDialog({ teamId, trigger }: AddPlayerDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [isSearching, startSearch] = useTransition()
  const [isPending, startTransition] = useTransition()

  function handleSearch(value: string) {
    setSearch(value)
    if (!value.trim()) {
      setResults([])
      return
    }
    startSearch(async () => {
      const res = await searchUsersForTeamAction(value)
      setResults(res.success ? (res.data ?? []) : [])
    })
  }

  function handleAdd(player: UserSearchResult) {
    startTransition(async () => {
      const result = await addPlayerToTeamAction(teamId, player.id)
      if (result.success) {
        toast.success(`${player.name} fue agregado al equipo`)
        setSearch('')
        setResults([])
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
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-ot-light-blue/40 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-ot-orange/50"
          />
        </div>

        {isSearching && (
          <p className="text-xs text-white/40 text-center py-2">Buscando...</p>
        )}

        {!isSearching && results.length > 0 && (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {results.map((player) => (
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

        {!isSearching && search.trim().length > 0 && results.length === 0 && (
          <p className="text-sm text-white/40 text-center py-4">
            No se encontraron jugadores
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
