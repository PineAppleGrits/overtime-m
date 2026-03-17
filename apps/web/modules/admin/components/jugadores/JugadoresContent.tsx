'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Search, AlertCircle } from 'lucide-react'
import playerBrowserService from '@/modules/admin/services/browser/playerService'
import { createPlayerAction, updatePlayerAction, deletePlayerAction } from '@/modules/admin/actions/playerActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { useDebouncedValue } from '@/modules/admin/hooks/useDebouncedValue'
import { PlayerFormDialog, type PlayerRow } from './PlayerFormDialog'

const PLAYERS_KEY = ['admin', 'players'] as const

interface JugadoresContentProps {
  initialData: {
    data: PlayerRow[]
    meta: { total: number; page: number; limit: number; totalPages: number }
    error: string | null
  }
}

export function JugadoresContent({ initialData }: JugadoresContentProps) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [dialog, setDialog] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<PlayerRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: PLAYERS_KEY }), [qc])

  const { data, isPending, isError } = useQuery({
    queryKey: [...PLAYERS_KEY, page],
    queryFn: async () => {
      const response = await playerBrowserService.getPlayers({ page, limit: 10 })
      const raw = response.data ?? response
      return {
        data: (raw.data ?? raw ?? []) as PlayerRow[],
        meta: raw.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 },
      }
    },
    initialData: page === 1 && !initialData.error ? { data: initialData.data, meta: initialData.meta } : undefined,
    placeholderData: (prev) => prev,
  })

  const players = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1

  const filteredPlayers = useMemo(
    () => debouncedSearch
      ? players.filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase()))
      : players,
    [players, debouncedSearch]
  )

  const closeDialog = useCallback(() => { setDialog(false); setEditingPlayer(null) }, [])

  const createAction = useServerAction(createPlayerAction, { successMessage: 'Jugador creado', onSuccess: () => { invalidate(); closeDialog() } })
  const updateAction = useServerAction(updatePlayerAction, { successMessage: 'Jugador actualizado', onSuccess: () => { invalidate(); closeDialog() } })
  const deleteAction = useServerAction(deletePlayerAction, { successMessage: 'Jugador eliminado', onSuccess: () => { invalidate(); setDeleteId(null) } })

  const handleSubmit = (formData: { firstName: string; lastName: string; jerseyNumber?: number; position?: string; height?: number; weight?: number; photoUrl?: string }) => {
    if (editingPlayer) {
      updateAction.execute({ id: editingPlayer.id, ...formData })
    } else {
      createAction.execute(formData)
    }
  }

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Jugadores" description="Gestiona todos los jugadores registrados en la plataforma" />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar los jugadores</p>
          <Button variant="outline" size="sm" onClick={() => invalidate()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const columns: Column<PlayerRow>[] = [
    {
      key: 'name', label: 'Jugador',
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={p.photoUrl} />
            <AvatarFallback className="text-xs">{p.firstName?.charAt(0)}{p.lastName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{p.firstName} {p.lastName}</p>
            {p.documentNumber && <p className="text-xs text-muted-foreground">DNI: {p.documentNumber}</p>}
          </div>
        </div>
      ),
    },
    { key: 'position', label: 'Posición', render: (p) => <span className="text-sm">{p.position ?? '-'}</span> },
    { key: 'jerseyNumber', label: '#', render: (p) => <span className="text-sm">{p.jerseyNumber ?? '-'}</span> },
    {
      key: 'isBlacklisted', label: 'Estado',
      render: (p) => p.isBlacklisted
        ? <Badge variant="destructive">Lista negra</Badge>
        : <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Activo</Badge>,
    },
    {
      key: 'actions', label: '', className: 'w-10',
      render: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setEditingPlayer(p); setDialog(true) }}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Jugadores" description="Gestiona todos los jugadores registrados en la plataforma" onCreateClick={() => setDialog(true)} createLabel="Nuevo jugador" />
      <div className="mb-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar jugadores..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div></div>
      <DataTable columns={columns} data={filteredPlayers} loading={isPending} emptyMessage="No hay jugadores registrados" page={page} totalPages={totalPages} onPageChange={setPage} />
      <PlayerFormDialog open={dialog} onOpenChange={(open) => !open && closeDialog()} editingPlayer={editingPlayer} onSubmit={handleSubmit} isPending={createAction.isPending || updateAction.isPending} />
      <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} title="Eliminar jugador" description="¿Estás seguro de eliminar este jugador?" variant="destructive" confirmLabel="Eliminar" onConfirm={() => deleteId && deleteAction.execute({ id: deleteId })} loading={deleteAction.isPending} />
    </div>
  )
}
