'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Search,
  MapPin,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import venueBrowserService from '@/modules/admin/services/browser/venueService'
import {
  createVenueAction,
  updateVenueAction,
  deleteVenueAction,
} from '@/modules/admin/actions/venueActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { useDebouncedValue } from '@/modules/admin/hooks/useDebouncedValue'
import { VenueFormDialog, type VenueRow } from './VenueFormDialog'

const VENUES_QUERY_KEY = ['admin', 'venues'] as const

interface CanchasContentProps {
  initialData: {
    data: VenueRow[]
    meta: { total: number; page: number; limit: number; totalPages: number }
    error: string | null
  }
}

export function CanchasContent({ initialData }: CanchasContentProps) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [dialog, setDialog] = useState(false)
  const [editingVenue, setEditingVenue] = useState<VenueRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: VENUES_QUERY_KEY }),
    [queryClient]
  )

  const { data, isPending, isError } = useQuery({
    queryKey: [...VENUES_QUERY_KEY, page, debouncedSearch],
    queryFn: async () => {
      const response = await venueBrowserService.getVenues({ page, limit: 10 })
      const raw = response.data ?? response
      return {
        data: (raw.data ?? raw ?? []) as VenueRow[],
        meta: raw.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 },
      }
    },
    initialData:
      page === 1 && debouncedSearch === '' && !initialData.error
        ? { data: initialData.data, meta: initialData.meta }
        : undefined,
    placeholderData: (prev) => prev,
  })

  const venues = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1

  // Client-side filter on top of paginated data
  const filteredVenues = debouncedSearch
    ? venues.filter((v) =>
        v.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : venues

  const closeDialog = useCallback(() => {
    setDialog(false)
    setEditingVenue(null)
  }, [])

  const createAction = useServerAction(createVenueAction, {
    successMessage: 'Cancha creada',
    onSuccess: () => { invalidate(); closeDialog() },
  })

  const updateAction = useServerAction(updateVenueAction, {
    successMessage: 'Cancha actualizada',
    onSuccess: () => { invalidate(); closeDialog() },
  })

  const deleteAction = useServerAction(deleteVenueAction, {
    successMessage: 'Cancha eliminada',
    onSuccess: () => { invalidate(); setDeleteId(null) },
  })

  const handleSubmit = (formData: {
    name: string
    address?: string
    city?: string
    province?: string
    country?: string
    googleMapsUrl?: string
    capacity?: number
    isActive: boolean
  }) => {
    if (editingVenue) {
      updateAction.execute({ id: editingVenue.id, ...formData })
    } else {
      createAction.execute(formData)
    }
  }

  const openEdit = (venue: VenueRow) => {
    setEditingVenue(venue)
    setDialog(true)
  }

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader
          title="Canchas"
          description="Gestiona las canchas y lugares donde se juegan los partidos"
        />
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar las canchas</p>
          <Button variant="outline" size="sm" onClick={() => invalidate()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  const columns: Column<VenueRow>[] = [
    {
      key: 'name',
      label: 'Cancha',
      render: (v) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{v.name}</p>
            {v.address && (
              <p className="text-xs text-muted-foreground">{v.address}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'city',
      label: 'Ciudad',
      render: (v) => <span className="text-sm">{v.city ?? '-'}</span>,
    },
    {
      key: 'capacity',
      label: 'Capacidad',
      render: (v) => (
        <span className="text-sm">
          {v.capacity ? `${v.capacity} personas` : '-'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (v) =>
        v.isActive ? (
          <Badge
            variant="outline"
            className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
          >
            Activa
          </Badge>
        ) : (
          <Badge variant="outline">Inactiva</Badge>
        ),
    },
    {
      key: 'googleMapsUrl',
      label: 'Mapa',
      render: (v) =>
        v.googleMapsUrl ? (
          <a
            href={v.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Ver mapa
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10',
      render: (v) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(v)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteId(v.id)}
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
        title="Canchas"
        description="Gestiona las canchas y lugares donde se juegan los partidos"
        onCreateClick={() => setDialog(true)}
        createLabel="Nueva cancha"
      />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar canchas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredVenues}
        loading={isPending}
        emptyMessage="No hay canchas registradas"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <VenueFormDialog
        open={dialog}
        onOpenChange={(open) => !open && closeDialog()}
        editingVenue={editingVenue}
        onSubmit={handleSubmit}
        isPending={createAction.isPending || updateAction.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar cancha"
        description="¿Estás seguro de eliminar esta cancha?"
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={() => deleteId && deleteAction.execute({ id: deleteId })}
        loading={deleteAction.isPending}
      />
    </div>
  )
}
