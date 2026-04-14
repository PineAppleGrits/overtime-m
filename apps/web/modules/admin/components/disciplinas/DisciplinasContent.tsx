'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Dumbbell, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import sportBrowserService from '@/modules/admin/services/browser/sportService'
import {
  createSportAction,
  updateSportAction,
  deleteSportAction,
} from '@/modules/admin/actions/sportActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { SportFormDialog, type SportRow } from './SportFormDialog'

const SPORTS_QUERY_KEY = ['admin', 'sports'] as const

interface DisciplinasContentProps {
  initialData: {
    data: SportRow[]
    error: string | null
  }
}

export function DisciplinasContent({ initialData }: DisciplinasContentProps) {
  const queryClient = useQueryClient()
  const [dialog, setDialog] = useState(false)
  const [editingSport, setEditingSport] = useState<SportRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: SPORTS_QUERY_KEY }),
    [queryClient]
  )

  const { data: sports = [], isPending, isError } = useQuery({
    queryKey: [...SPORTS_QUERY_KEY],
    queryFn: async () => {
      const response = await sportBrowserService.getSports()
      return (response.data ?? response ?? []) as SportRow[]
    },
    initialData: initialData.error ? undefined : initialData.data,
  })

  const closeDialog = useCallback(() => {
    setDialog(false)
    setEditingSport(null)
  }, [])

  const createAction = useServerAction(createSportAction, {
    successMessage: 'Disciplina creada',
    onSuccess: () => { invalidate(); closeDialog() },
  })

  const updateAction = useServerAction(updateSportAction, {
    successMessage: 'Disciplina actualizada',
    onSuccess: () => { invalidate(); closeDialog() },
  })

  const deleteAction = useServerAction(deleteSportAction, {
    successMessage: 'Disciplina eliminada',
    onSuccess: () => { invalidate(); setDeleteId(null) },
  })

  const handleSubmit = (data: { name: string; code: string; description?: string }) => {
    if (editingSport) {
      updateAction.execute({ id: editingSport.id, ...data })
    } else {
      createAction.execute(data)
    }
  }

  const openEdit = (sport: SportRow) => {
    setEditingSport(sport)
    setDialog(true)
  }

  // Show error fallback when SSR and client fetch both failed
  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader
          title="Disciplinas"
          description="Gestiona los deportes disponibles en la plataforma"
        />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar las disciplinas</p>
          <Button variant="outline" size="sm" onClick={() => invalidate()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  const columns: Column<SportRow>[] = [
    {
      key: 'name',
      label: 'Disciplina',
      render: (s) => (
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{s.name}</span>
        </div>
      ),
    },
    {
      key: 'code',
      label: 'Código',
      render: (s) => (
        <code className="rounded bg-muted px-2 py-0.5 text-sm">{s.code}</code>
      ),
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (s) => <span className="text-sm">{s.description ?? '-'}</span>,
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10',
      render: (s) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(s)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteId(s.id)}
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
        title="Disciplinas"
        description="Gestiona los deportes disponibles en la plataforma"
        onCreateClick={() => setDialog(true)}
        createLabel="Nueva disciplina"
      />

      <DataTable
        columns={columns}
        data={sports}
        loading={isPending}
        emptyMessage="No hay disciplinas registradas"
      />

      <SportFormDialog
        open={dialog}
        onOpenChange={(open) => !open && closeDialog()}
        editingSport={editingSport}
        onSubmit={handleSubmit}
        isPending={createAction.isPending || updateAction.isPending}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar disciplina"
        description="¿Estás seguro de eliminar esta disciplina? Los torneos asociados podrían verse afectados."
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={() => deleteId && deleteAction.execute({ id: deleteId })}
        loading={deleteAction.isPending}
      />
    </div>
  )
}
