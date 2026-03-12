'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2, Search, Loader2, ShieldBan, UserX, ToggleLeft, AlertCircle } from 'lucide-react'
import blacklistBrowserService from '@/modules/admin/services/BlacklistService'
import { BlacklistEntry } from '@/modules/admin/types'
import { createBlacklistAction, toggleBlacklistAction, deleteBlacklistAction } from '@/modules/admin/actions/blacklistActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { useDebouncedValue } from '@/modules/admin/hooks/useDebouncedValue'

const BL_KEY = ['admin', 'blacklist'] as const

interface BlacklistContentProps {
  initialData: { data: BlacklistEntry[]; meta: { total: number; page: number; limit: number; totalPages: number }; error: string | null }
}

export function BlacklistContent({ initialData }: BlacklistContentProps) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [createDialog, setCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', documentNumber: '', reason: '' })
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: BL_KEY }), [qc])

  const { data, isPending, isError } = useQuery({
    queryKey: [...BL_KEY, page],
    queryFn: async () => {
      const response = await blacklistBrowserService.getEntries({ page, limit: 10 })
      const raw = response.data ?? response
      return { data: (raw.data ?? raw ?? []) as BlacklistEntry[], meta: raw.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 } }
    },
    initialData: page === 1 && !initialData.error ? { data: initialData.data, meta: initialData.meta } : undefined,
    placeholderData: (prev) => prev,
  })

  const entries = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1
  const filtered = debouncedSearch ? entries.filter((e) => `${e.firstName} ${e.lastName} ${e.documentNumber}`.toLowerCase().includes(debouncedSearch.toLowerCase())) : entries

  const createAction = useServerAction(createBlacklistAction, {
    successMessage: 'Persona agregada a la lista negra',
    onSuccess: () => { invalidate(); setCreateDialog(false); setCreateForm({ firstName: '', lastName: '', documentNumber: '', reason: '' }) },
  })
  const toggleAction = useServerAction(toggleBlacklistAction, { onSuccess: invalidate })
  const deleteAction = useServerAction(deleteBlacklistAction, { successMessage: 'Entrada eliminada', onSuccess: () => { invalidate(); setDeleteId(null) } })

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Lista Negra" description="Personas que no pueden participar" backHref="/admin/jugadores" />
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Error al cargar la lista negra</p>
          <Button variant="outline" size="sm" onClick={() => invalidate()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const columns: Column<BlacklistEntry>[] = [
    { key: 'name', label: 'Persona', render: (e) => (<div className="flex items-center gap-2"><UserX className="h-4 w-4 text-destructive" /><div><p className="font-medium">{e.firstName} {e.lastName}</p><p className="text-xs text-muted-foreground">DNI: {e.documentNumber}</p></div></div>) },
    { key: 'reason', label: 'Motivo', render: (e) => <span className="text-sm">{e.reason}</span> },
    { key: 'isActive', label: 'Estado', render: (e) => e.isActive ? <Badge variant="destructive">Activo</Badge> : <Badge variant="outline">Inactivo</Badge> },
    { key: 'createdAt', label: 'Fecha', render: (e) => <span className="text-sm">{new Date(e.createdAt).toLocaleDateString('es-AR')}</span> },
    {
      key: 'actions', label: '', className: 'w-10',
      render: (e) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toggleAction.execute({ id: e.id, isActive: !e.isActive })}><ToggleLeft className="mr-2 h-4 w-4" />{e.isActive ? 'Desactivar' : 'Activar'}</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(e.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Lista Negra" description="Personas que no pueden participar en ningún equipo ni torneo" backHref="/admin/jugadores" onCreateClick={() => setCreateDialog(true)} createLabel="Agregar a lista negra" />
      <Card className="mb-6 border-destructive/20 bg-destructive/5"><CardHeader className="pb-2"><div className="flex items-center gap-2"><ShieldBan className="h-5 w-5 text-destructive" /><CardTitle className="text-base">Información importante</CardTitle></div></CardHeader><CardContent><CardDescription>Las personas en esta lista están bloqueadas de participar en cualquier equipo. Al registrarse con su DNI, el sistema validará automáticamente si están en la lista negra e impedirá su inscripción.</CardDescription></CardContent></Card>
      <div className="mb-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por nombre o DNI..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div></div>
      <DataTable columns={columns} data={filtered} loading={isPending} emptyMessage="No hay personas en la lista negra" page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar a lista negra</DialogTitle><DialogDescription>Esta persona no podrá participar en ningún equipo ni torneo</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nombre *</Label><Input value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Apellido *</Label><Input value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>DNI *</Label><Input placeholder="12345678" value={createForm.documentNumber} onChange={(e) => setCreateForm({ ...createForm, documentNumber: e.target.value })} /></div>
            <div className="space-y-2"><Label>Motivo *</Label><Textarea placeholder="Razón por la que se agrega..." value={createForm.reason} onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => createAction.execute(createForm)} disabled={createAction.isPending}>{createAction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Agregar a lista negra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} title="Eliminar de lista negra" description="¿Eliminar esta entrada? La persona podrá volver a participar." variant="destructive" confirmLabel="Eliminar" onConfirm={() => deleteId && deleteAction.execute({ id: deleteId })} loading={deleteAction.isPending} />
    </div>
  )
}
