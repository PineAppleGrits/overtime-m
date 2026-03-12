'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Archive,
  Send,
  Search,
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

  const { data, isPending } = useQuery({
    queryKey: [...TOURNAMENTS_QUERY_KEY, page, statusFilter, debouncedSearch],
    queryFn: async ({ signal }) => {
      const params: GetTournamentsParams = {
        page,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter as TournamentStatus }),
        ...(debouncedSearch && { search: debouncedSearch }),
      }
      const raw = await adminTournamentService.getTournaments(params, {
        signal,
      })
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
  const totalPages = data?.meta?.totalPages ?? 1

  const handleDelete = () => {
    if (!deleteId) return
    deleteAction.execute({ id: deleteId })
  }

  const handleStatusChange = (id: string, status: TournamentStatus) => {
    statusAction.execute({ id, status })
  }

  const columns: Column<AdminTournament>[] = [
    {
      key: 'name',
      label: 'Nombre',
      render: (t) => (
        <div>
          <p className="font-medium">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.sportName}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (t) => <StatusBadge status={t.status} type="tournament" />,
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
      key: 'registrationOpen',
      label: 'Inscripciones',
      render: (t) => (
        <StatusBadge
          status={t.registrationOpen ? 'approved' : 'rejected'}
          type="registration"
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10',
      render: (t) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/admin/torneos/${t.id}`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/admin/torneos/${t.id}/categorias`)
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              Categorías / Zonas
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/admin/torneos/${t.id}/inscripciones`)
              }
            >
              <Eye className="mr-2 h-4 w-4" />
              Inscripciones
            </DropdownMenuItem>
            {t.status === 'draft' && (
              <DropdownMenuItem
                onClick={() => handleStatusChange(t.id, 'published')}
              >
                <Send className="mr-2 h-4 w-4" />
                Publicar
              </DropdownMenuItem>
            )}
            {t.status === 'published' && (
              <DropdownMenuItem
                onClick={() => handleStatusChange(t.id, 'archived')}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archivar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteId(t.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar torneos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="archived">Archivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={tournaments}
        loading={isPending}
        emptyMessage="No hay torneos creados"
        page={page}
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
