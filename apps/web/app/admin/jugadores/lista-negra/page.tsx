'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import blacklistService from '@/modules/admin/services/BlacklistService'
import { BlacklistEntry } from '@/modules/admin/types'
import { toast } from 'sonner'
import { MoreHorizontal, Trash2, Search, Loader2, ShieldBan, UserX, ToggleLeft } from 'lucide-react'

export default function BlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Create dialog
  const [createDialog, setCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    documentNumber: '',
    reason: '',
  })
  const [creating, setCreating] = useState(false)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const response = await blacklistService.getEntries({ page, limit: 10 })
      setEntries(response.data?.data ?? response.data ?? [])
      setTotalPages(response.data?.meta?.totalPages ?? 1)
    } catch {
      toast.error('Error al cargar la lista negra')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const handleCreate = async () => {
    if (!createForm.firstName || !createForm.lastName || !createForm.documentNumber || !createForm.reason) {
      toast.error('Todos los campos son obligatorios')
      return
    }
    setCreating(true)
    try {
      await blacklistService.createEntry({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        documentNumber: createForm.documentNumber,
        reason: createForm.reason,
      })
      toast.success('Persona agregada a la lista negra')
      setCreateDialog(false)
      setCreateForm({ firstName: '', lastName: '', documentNumber: '', reason: '' })
      fetchEntries()
    } catch {
      toast.error('Error al agregar a la lista negra')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (entry: BlacklistEntry) => {
    try {
      await blacklistService.updateEntry(entry.id, { isActive: !entry.isActive })
      toast.success(entry.isActive ? 'Entrada desactivada' : 'Entrada activada')
      fetchEntries()
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await blacklistService.deleteEntry(deleteId)
      toast.success('Entrada eliminada')
      fetchEntries()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const filteredEntries = entries.filter((e) =>
    search
      ? `${e.firstName} ${e.lastName} ${e.documentNumber}`
          .toLowerCase()
          .includes(search.toLowerCase())
      : true
  )

  const columns: Column<BlacklistEntry>[] = [
    {
      key: 'name',
      label: 'Persona',
      render: (e) => (
        <div className="flex items-center gap-2">
          <UserX className="h-4 w-4 text-destructive" />
          <div>
            <p className="font-medium">{e.firstName} {e.lastName}</p>
            <p className="text-xs text-muted-foreground">DNI: {e.documentNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Motivo',
      render: (e) => <span className="text-sm">{e.reason}</span>,
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (e) =>
        e.isActive ? (
          <Badge variant="destructive">Activo</Badge>
        ) : (
          <Badge variant="outline">Inactivo</Badge>
        ),
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      render: (e) => (
        <span className="text-sm">
          {new Date(e.createdAt).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10',
      render: (e) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleToggleActive(e)}>
              <ToggleLeft className="mr-2 h-4 w-4" />
              {e.isActive ? 'Desactivar' : 'Activar'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(e.id)}>
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
        title="Lista Negra"
        description="Personas que no pueden participar en ningún equipo ni torneo"
        backHref="/admin/jugadores"
        onCreateClick={() => setCreateDialog(true)}
        createLabel="Agregar a lista negra"
      />

      <Card className="mb-6 border-destructive/20 bg-destructive/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ShieldBan className="h-5 w-5 text-destructive" />
            <CardTitle className="text-base">Información importante</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Las personas en esta lista están bloqueadas de participar en cualquier equipo.
            Al registrarse con su DNI, el sistema validará automáticamente si están en la lista negra
            e impedirá su inscripción.
          </CardDescription>
        </CardContent>
      </Card>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredEntries}
        loading={loading}
        emptyMessage="No hay personas en la lista negra"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar a lista negra</DialogTitle>
            <DialogDescription>
              Esta persona no podrá participar en ningún equipo ni torneo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>DNI *</Label>
              <Input
                placeholder="12345678"
                value={createForm.documentNumber}
                onChange={(e) => setCreateForm({ ...createForm, documentNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea
                placeholder="Razón por la que se agrega a la lista negra..."
                value={createForm.reason}
                onChange={(e) => setCreateForm({ ...createForm, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar a lista negra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar de lista negra"
        description="¿Eliminar esta entrada de la lista negra? La persona podrá volver a participar."
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
