'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import sportService from '@/modules/admin/services/browser/sportService'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2, Loader2, Dumbbell } from 'lucide-react'

interface SportRow {
  id: string
  name: string
  code: string
  description?: string
  createdAt: string
}

export default function DisciplinesPage() {
  const [sports, setSports] = useState<SportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Create/Edit dialog
  const [dialog, setDialog] = useState(false)
  const [editingSport, setEditingSport] = useState<SportRow | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '' })
  const [saving, setSaving] = useState(false)

  const fetchSports = useCallback(async () => {
    setLoading(true)
    try {
      const response = await sportService.getSports()
      setSports(response.data ?? response ?? [])
    } catch {
      toast.error('Error al cargar disciplinas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSports()
  }, [fetchSports])

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast.error('Nombre y código son obligatorios')
      return
    }
    setSaving(true)
    try {
      if (editingSport) {
        await sportService.updateSport(editingSport.id, {
          name: form.name,
          code: form.code,
          description: form.description || undefined,
        })
        toast.success('Disciplina actualizada')
      } else {
        await sportService.createSport({
          name: form.name,
          code: form.code,
          description: form.description || undefined,
        })
        toast.success('Disciplina creada')
      }
      closeDialog()
      fetchSports()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await sportService.deleteSport(deleteId)
      toast.success('Disciplina eliminada')
      fetchSports()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const openEdit = (sport: SportRow) => {
    setEditingSport(sport)
    setForm({
      name: sport.name,
      code: sport.code,
      description: sport.description ?? '',
    })
    setDialog(true)
  }

  const closeDialog = () => {
    setDialog(false)
    setEditingSport(null)
    setForm({ name: '', code: '', description: '' })
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
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(s)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(s.id)}>
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
        loading={loading}
        emptyMessage="No hay disciplinas registradas"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSport ? 'Editar disciplina' : 'Nueva disciplina'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input placeholder="Ej: Básquet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input placeholder="Ej: BASKET" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              <p className="text-xs text-muted-foreground">Identificador único para uso interno</p>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea placeholder="Descripción opcional..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSport ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar disciplina"
        description="¿Estás seguro de eliminar esta disciplina? Los torneos asociados podrían verse afectados."
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
