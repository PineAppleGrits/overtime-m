'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Search,
  AlertCircle,
} from 'lucide-react'
import adminTournamentService, {
  type GetTournamentsParams,
} from '@/modules/admin/services/AdminTournamentService'
import { AdminTournament, TournamentStatus } from '@/modules/admin/types'
import { useDebouncedValue } from '@/modules/admin/hooks/useDebouncedValue'
import { useQueryClient } from '@tanstack/react-query'
import { deleteTournamentAction, changeStatusAction } from '@/modules/admin/actions/tournamentActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'

const TOURNAMENTS_QUERY_KEY = ['admin', 'tournaments'] as const

/**
 * Valid status transitions as defined by the backend state machine.
 */
const STATUS_TRANSITIONS: Record<TournamentStatus, { status: TournamentStatus; label: string }[]> = {
  DRAFT: [{ status: 'PUBLISHED', label: 'Publicar' }],
  PUBLISHED: [{ status: 'INSCRIPTION_OPEN', label: 'Abrir inscripciones' }],
  INSCRIPTION_OPEN: [{ status: 'INSCRIPTION_CLOSED', label: 'Cerrar inscripciones' }],
  INSCRIPTION_CLOSED: [{ status: 'IN_PROGRESS', label: 'Pasar a armado' }],
  IN_PROGRESS: [{ status: 'PLAYING', label: 'Comenzar torneo' }],
  PLAYING: [{ status: 'FINISHED', label: 'Finalizar torneo' }],
  FINISHED: [{ status: 'ARCHIVED', label: 'Archivar' }],
  ARCHIVED: [],
}

/** Statuses from which the tournament can be archived directly. */
const ARCHIVABLE_STATUSES: TournamentStatus[] = [
  'DRAFT',
  'PUBLISHED',
  'INSCRIPTION_OPEN',
  'INSCRIPTION_CLOSED',
  'IN_PROGRESS',
  'PLAYING',
]

function normaliseTournamentsResponse(raw: unknown): {
  data: AdminTournament[]
  meta: { total: number; page: number; limit: number; totalPages: number }
} {
  if (Array.isArray(raw)) {
    return {
      data: raw,
      meta: { total: raw.length, page: 1, limit: 10, totalPages: 1 },
    }
  }
  const obj = raw as { data?: AdminTournament[]; meta?: { total: number; page: number; limit: number; totalPages: number } }
  return {
    data: obj.data ?? [],
    meta: obj.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 },
  }
}

export interface TournamentsContentProps {
  initialData: {
    data: AdminTournament[]
    meta: { total: number; page: number; limit: number; totalPages: number }
  }
}

export function TournamentsContent({ initialData }: TournamentsContentProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [...TOURNAMENTS_QUERY_KEY, page, statusFilter, debouncedSearch],
    queryFn: async ({ signal }) => {
      const params: GetTournamentsParams = {
        page,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter as TournamentStatus }),
        ...(debouncedSearch && { search: debouncedSearch }),
      }
      const raw = await adminTournamentService.getTournaments(params, { signal })
      return normaliseTournamentsResponse(raw)
    },
    initialData:
      page === 1 && statusFilter === 'all' && debouncedSearch === ''
        ? initialData
        : undefined,
    placeholderData: (prev) => prev,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: TOURNAMENTS_QUERY_KEY })

  const deleteAction = useServerAction(deleteTournamentAction, {
    successMessage: 'Torneo eliminado',
    onSuccess: () => { invalidate(); setDeleteId(null) },
  })

  const statusAction = useServerAction(changeStatusAction, {
    successMessage: 'Estado actualizado',
    onSuccess: invalidate,
  })

  const tournaments = data?.data ?? []
  const total = data?.meta?.total
  const totalPages = data?.meta?.totalPages ?? 1

  const handleDelete = () => {
    if (!deleteId) return
    deleteAction.execute({ id: deleteId })
  }

  const handleStatusChange = (id: string, status: TournamentStatus) => {
    statusAction.execute({ id, status })
  }

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Torneos"
          description="Gestiona todos los torneos de la plataforma"
          createHref="/admin/torneos/nuevo"
          createLabel="Nuevo torneo"
        />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar los torneos</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const columns: Column<AdminTournament>[] = [
    {
      key: 'name',
      label: 'Nombre',
      render: (t) => (
        <div>
          <p className="font-medium">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.sport?.name ?? '-'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (t) => <StatusBadge status={t.status} type="tournament" />,
    },
    {
      key: 'categories',
      label: 'Categorías',
      render: (t) => (
        <span className="text-sm">{t._count?.categories ?? t.categories?.length ?? 0}</span>
      ),
    },
    {
      key: 'registrations',
      label: 'Inscripciones',
      render: (t) => (
        <span className="text-sm">{t._count?.registrations ?? 0}</span>
      ),
    },
    {
      key: 'startDate',
      label: 'Fecha inicio',
      render: (t) => (
        <span className="text-sm">
          {t.startDate
            ? new Date(t.startDate).toLocaleDateString('es-AR')
            : '-'}
        </span>
      ),
    },
    {
      key: 'endDate',
      label: 'Fecha fin',
      render: (t) => (
        <span className="text-sm">
          {t.endDate ? new Date(t.endDate).toLocaleDateString('es-AR') : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-auto',
      render: (t) => {
        const transitions = STATUS_TRANSITIONS[t.status] ?? []
        const canArchive = ARCHIVABLE_STATUSES.includes(t.status)

        return (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8" asChild>
              <Link href={`/admin/torneos/${t.id}`}>
                <Eye className="mr-1.5 size-3.5" />
                Ver
              </Link>
            </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Acciones del torneo">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/admin/torneos/${t.id}`)}>
                <Pencil className="mr-2 size-4" />Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/torneos/${t.id}/categorias`)}>
                <Eye className="mr-2 size-4" />Categorías / Zonas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/torneos/${t.id}/inscripciones`)}>
                <Eye className="mr-2 size-4" />Inscripciones
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/admin/torneos/${t.id}/partidos`)}>
                <Eye className="mr-2 size-4" />Partidos
              </DropdownMenuItem>

              {transitions.length > 0 && <DropdownMenuSeparator />}
              {transitions.map((tr) => (
                <DropdownMenuItem key={tr.status} onClick={() => handleStatusChange(t.id, tr.status)}>
                  {tr.label}
                </DropdownMenuItem>
              ))}
              {canArchive && (
                <DropdownMenuItem className="text-amber-600" onClick={() => handleStatusChange(t.id, 'ARCHIVED')}>
                  Archivar
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteId(t.id)}
              >
                <Trash2 className="mr-2 size-4" />Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Torneos"
        description="Gestiona todos los torneos de la plataforma"
        createHref="/admin/torneos/nuevo"
        createLabel="Nuevo torneo"
      />

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar torneos..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
            aria-label="Buscar torneos"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[200px]" aria-label="Filtrar por estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="DRAFT">Borrador</SelectItem>
            <SelectItem value="PUBLISHED">Publicado</SelectItem>
            <SelectItem value="INSCRIPTION_OPEN">Inscripciones abiertas</SelectItem>
            <SelectItem value="INSCRIPTION_CLOSED">Inscripciones cerradas</SelectItem>
            <SelectItem value="IN_PROGRESS">Armando fixture</SelectItem>
            <SelectItem value="PLAYING">En juego</SelectItem>
            <SelectItem value="FINISHED">Finalizado</SelectItem>
            <SelectItem value="ARCHIVED">Archivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={tournaments}
        loading={isPending}
        emptyMessage="No hay torneos creados"
        page={page}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar torneo"
        description="¿Estás seguro de que deseas eliminar este torneo? Esta acción no se puede deshacer."
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        loading={deleteAction.isPending}
      />
    </div>
  )
}
