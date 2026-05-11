'use client'

import { useState, useCallback, useMemo } from 'react'
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
  id: string
  name: string
  slug: string
  logoUrl?: string
  sport?: { id: string; name: string }
  creator?: { id: string; name: string; email?: string }
  captain?: { id: string; name: string } | null
  members?: { id: string; isActive: boolean }[]
  franchise?: { id: string; name: string } | null
  createdAt: string
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
  const total = data?.meta?.total
  const totalPages = data?.meta?.totalPages ?? 1
  const filtered = useMemo(
    () => debouncedSearch
      ? teams.filter((t) => t.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      : teams,
    [teams, debouncedSearch]
  )

  const deleteAction = useServerAction(deleteTeamAction, { successMessage: 'Equipo eliminado', onSuccess: () => { invalidate(); setDeleteId(null) } })

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Equipos" description="Gestiona los equipos" />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
          <AlertCircle className="size-8 text-destructive" />
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
          <Avatar className="size-8">
            <AvatarImage src={t.logoUrl} alt={t.name} />
            <AvatarFallback className="text-xs">{t.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{t.name}</p>
            {t.franchise && <p className="text-xs text-muted-foreground">{t.franchise.name}</p>}
          </div>
        </div>
      ),
    },
    { key: 'sport', label: 'Disciplina', render: (t) => <span className="text-sm">{t.sport?.name ?? '-'}</span> },
    { key: 'creator', label: 'Creador', render: (t) => <span className="text-sm">{t.creator?.name ?? '-'}</span> },
    { key: 'members', label: 'Jugadores', render: (t) => <span className="text-sm">{t.members?.filter(m => m.isActive).length ?? 0}</span> },
    {
      key: 'actions', label: '', className: 'w-10',
      render: (t) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label="Acciones"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/admin/equipos/${t.id}`)}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/equipos/${t.id}?tab=players`)}><Users className="mr-2 size-4" />Jugadores</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="mr-2 size-4" />Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Equipos" description="Gestiona los equipos. Los equipos pueden tener categorías (ej: Barcelona A, Barcelona B) y compartir logo." createHref="/admin/equipos/nuevo" createLabel="Nuevo equipo" />
      <p className="mb-4 text-sm text-muted-foreground">Los equipos los crean los usuarios desde la plataforma. Desde aca podes editar datos, gestionar jugadores, o eliminar equipos.</p>
      <div className="mb-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar equipos..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" aria-label="Buscar equipos" /></div></div>
      <DataTable columns={columns} data={filtered} loading={isPending} emptyMessage="No hay equipos registrados" page={page} total={total} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} title="Eliminar equipo" description="¿Estás seguro de eliminar este equipo? Se eliminará toda la información asociada." variant="destructive" confirmLabel="Eliminar" onConfirm={() => deleteId && deleteAction.execute({ id: deleteId })} loading={deleteAction.isPending} />
    </div>
  )
}
