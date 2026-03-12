'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MoreHorizontal, Pencil, Trash2, Users, Search, AlertCircle } from 'lucide-react'
import teamBrowserService from '@/modules/admin/services/browser/teamService'
import { deleteTeamAction } from '@/modules/admin/actions/teamActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { useDebouncedValue } from '@/modules/admin/hooks/useDebouncedValue'

const TEAM_KEY = ['admin', 'teams'] as const

interface TeamRow {
  id: string; name: string; slug: string; logoUrl?: string; sportName?: string; category?: string; parentTeamName?: string; playersCount?: number; ownerName?: string; createdAt: string
}

interface EquiposContentProps {
  initialData: { data: TeamRow[]; meta: { total: number; page: number; limit: number; totalPages: number }; error: string | null }
}

export function EquiposContent({ initialData }: EquiposContentProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: TEAM_KEY }), [qc])

  const { data, isPending, isError } = useQuery({
    queryKey: [...TEAM_KEY, page],
    queryFn: async () => {
      const response = await teamBrowserService.getTeams({ page, limit: 10 })
      const raw = response.data ?? response
      return { data: (raw.data ?? raw ?? []) as TeamRow[], meta: raw.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 } }
    },
    initialData: page === 1 && !initialData.error ? { data: initialData.data, meta: initialData.meta } : undefined,
    placeholderData: (prev) => prev,
  })

  const teams = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1
  const filtered = debouncedSearch ? teams.filter((t) => t.name.toLowerCase().includes(debouncedSearch.toLowerCase())) : teams

  const deleteAction = useServerAction(deleteTeamAction, { successMessage: 'Equipo eliminado', onSuccess: () => { invalidate(); setDeleteId(null) } })

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Equipos" description="Gestiona los equipos" />
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar los equipos</p>
          <Button variant="outline" size="sm" onClick={() => invalidate()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const columns: Column<TeamRow>[] = [
    {
      key: 'name', label: 'Equipo',
      render: (t) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={t.logoUrl} alt={t.name} />
            <AvatarFallback className="text-xs">{t.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{t.name}</p>
            {t.category && <p className="text-xs text-muted-foreground">Categoría: {t.category}</p>}
          </div>
        </div>
      ),
    },
    { key: 'parentTeamName', label: 'Equipo padre', render: (t) => <span className="text-sm">{t.parentTeamName ?? '-'}</span> },
    { key: 'sportName', label: 'Disciplina' },
    { key: 'ownerName', label: 'Dueño', render: (t) => <span className="text-sm">{t.ownerName ?? '-'}</span> },
    { key: 'playersCount', label: 'Jugadores', render: (t) => <span className="text-sm">{t.playersCount ?? 0}</span> },
    {
      key: 'actions', label: '', className: 'w-10',
      render: (t) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/admin/equipos/${t.id}`)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/equipos/${t.id}?tab=players`)}><Users className="mr-2 h-4 w-4" />Jugadores</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Equipos" description="Gestiona los equipos. Los equipos pueden tener categorías (ej: Barcelona A, Barcelona B) y compartir logo." createHref="/admin/equipos/nuevo" createLabel="Nuevo equipo" />
      <div className="mb-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar equipos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div></div>
      <DataTable columns={columns} data={filtered} loading={isPending} emptyMessage="No hay equipos registrados" page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} title="Eliminar equipo" description="¿Estás seguro de eliminar este equipo? Se eliminará toda la información asociada." variant="destructive" confirmLabel="Eliminar" onConfirm={() => deleteId && deleteAction.execute({ id: deleteId })} loading={deleteAction.isPending} />
    </div>
  )
}
