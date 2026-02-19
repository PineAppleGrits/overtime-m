'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import playerService from '@/modules/admin/services/browser/playerService'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2, Search, Loader2 } from 'lucide-react'

interface PlayerRow {
  id: string
  firstName: string
  lastName: string
  documentNumber?: string
  jerseyNumber?: number
  position?: string
  height?: number
  weight?: number
  photoUrl?: string
  isBlacklisted?: boolean
  createdAt: string
}

export default function PlayersPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<PlayerRow[]>([])
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
    jerseyNumber: '',
    position: '',
    height: '',
    weight: '',
    photoUrl: '',
  })
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editDialog, setEditDialog] = useState<PlayerRow | null>(null)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    jerseyNumber: '',
    position: '',
    height: '',
    weight: '',
    photoUrl: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await playerService.getPlayers({ page, limit: 10 })
      setPlayers(response.data?.data ?? response.data ?? [])
      setTotalPages(response.data?.meta?.totalPages ?? 1)
    } catch {
      toast.error('Error al cargar jugadores')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  const handleCreate = async () => {
    if (!createForm.firstName || !createForm.lastName) {
      toast.error('Nombre y apellido son obligatorios')
      return
    }
    setCreating(true)
    try {
      await playerService.createPlayer({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        jerseyNumber: createForm.jerseyNumber ? parseInt(createForm.jerseyNumber) : undefined,
        position: createForm.position || undefined,
        height: createForm.height ? parseFloat(createForm.height) : undefined,
        weight: createForm.weight ? parseFloat(createForm.weight) : undefined,
        photoUrl: createForm.photoUrl || undefined,
      })
      toast.success('Jugador creado')
      setCreateDialog(false)
      setCreateForm({ firstName: '', lastName: '', jerseyNumber: '', position: '', height: '', weight: '', photoUrl: '' })
      fetchPlayers()
    } catch {
      toast.error('Error al crear jugador')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async () => {
    if (!editDialog) return
    setSaving(true)
    try {
      await playerService.updatePlayer(editDialog.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        jerseyNumber: editForm.jerseyNumber ? parseInt(editForm.jerseyNumber) : undefined,
        position: editForm.position || undefined,
        height: editForm.height ? parseFloat(editForm.height) : undefined,
        weight: editForm.weight ? parseFloat(editForm.weight) : undefined,
        photoUrl: editForm.photoUrl || undefined,
      })
      toast.success('Jugador actualizado')
      setEditDialog(null)
      fetchPlayers()
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await playerService.deletePlayer(deleteId)
      toast.success('Jugador eliminado')
      fetchPlayers()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const openEdit = (player: PlayerRow) => {
    setEditForm({
      firstName: player.firstName,
      lastName: player.lastName,
      jerseyNumber: player.jerseyNumber?.toString() ?? '',
      position: player.position ?? '',
      height: player.height?.toString() ?? '',
      weight: player.weight?.toString() ?? '',
      photoUrl: player.photoUrl ?? '',
    })
    setEditDialog(player)
  }

  const filteredPlayers = players.filter((p) =>
    search
      ? `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
      : true
  )

  const columns: Column<PlayerRow>[] = [
    {
      key: 'name',
      label: 'Jugador',
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={p.photoUrl} />
            <AvatarFallback className="text-xs">{p.firstName?.charAt(0)}{p.lastName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{p.firstName} {p.lastName}</p>
            {p.documentNumber && (
              <p className="text-xs text-muted-foreground">DNI: {p.documentNumber}</p>
            )}
          </div>
        </div>
      ),
    },
    { key: 'position', label: 'Posición', render: (p) => <span className="text-sm">{p.position ?? '-'}</span> },
    { key: 'jerseyNumber', label: '#', render: (p) => <span className="text-sm">{p.jerseyNumber ?? '-'}</span> },
    {
      key: 'isBlacklisted',
      label: 'Estado',
      render: (p) =>
        p.isBlacklisted ? (
          <Badge variant="destructive">Lista negra</Badge>
        ) : (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            Activo
          </Badge>
        ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10',
      render: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(p)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(p.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const PlayerFormFields = ({ form, setForm }: { form: typeof createForm; setForm: (f: typeof createForm) => void }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre *</Label>
          <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Apellido *</Label>
          <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Posición</Label>
          <Input placeholder="Ej: Base" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Número de camiseta</Label>
          <Input type="number" value={form.jerseyNumber} onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Altura (cm)</Label>
          <Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Peso (kg)</Label>
          <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>URL de foto</Label>
        <Input placeholder="https://..." value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} />
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Jugadores"
        description="Gestiona todos los jugadores registrados en la plataforma"
        onCreateClick={() => setCreateDialog(true)}
        createLabel="Nuevo jugador"
      />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar jugadores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredPlayers}
        loading={loading}
        emptyMessage="No hay jugadores registrados"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo jugador</DialogTitle></DialogHeader>
          <PlayerFormFields form={createForm} setForm={setCreateForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar jugador</DialogTitle></DialogHeader>
          <PlayerFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar jugador"
        description="¿Estás seguro de eliminar este jugador?"
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
