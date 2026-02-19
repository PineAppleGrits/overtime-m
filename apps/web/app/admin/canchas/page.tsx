'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import venueService from '@/modules/admin/services/browser/venueService'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2, Search, Loader2, MapPin, ExternalLink } from 'lucide-react'

interface VenueRow {
  id: string
  name: string
  address?: string
  city?: string
  province?: string
  country?: string
  googleMapsUrl?: string
  capacity?: number
  isActive: boolean
  createdAt: string
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<VenueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Create/Edit dialog
  const [dialog, setDialog] = useState(false)
  const [editingVenue, setEditingVenue] = useState<VenueRow | null>(null)
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    province: '',
    country: 'Argentina',
    googleMapsUrl: '',
    capacity: '',
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  const fetchVenues = useCallback(async () => {
    setLoading(true)
    try {
      const response = await venueService.getVenues({ page, limit: 10 })
      setVenues(response.data?.data ?? response.data ?? [])
      setTotalPages(response.data?.meta?.totalPages ?? 1)
    } catch {
      toast.error('Error al cargar canchas')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchVenues()
  }, [fetchVenues])

  const handleSave = async () => {
    if (!form.name) {
      toast.error('El nombre es obligatorio')
      return
    }
    setSaving(true)
    try {
      const dto = {
        name: form.name,
        address: form.address || undefined,
        city: form.city || undefined,
        province: form.province || undefined,
        country: form.country || undefined,
        googleMapsUrl: form.googleMapsUrl || undefined,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        isActive: form.isActive,
      }
      if (editingVenue) {
        await venueService.updateVenue(editingVenue.id, dto)
        toast.success('Cancha actualizada')
      } else {
        await venueService.createVenue(dto)
        toast.success('Cancha creada')
      }
      closeDialog()
      fetchVenues()
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
      await venueService.deleteVenue(deleteId)
      toast.success('Cancha eliminada')
      fetchVenues()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const openEdit = (venue: VenueRow) => {
    setEditingVenue(venue)
    setForm({
      name: venue.name,
      address: venue.address ?? '',
      city: venue.city ?? '',
      province: venue.province ?? '',
      country: venue.country ?? 'Argentina',
      googleMapsUrl: venue.googleMapsUrl ?? '',
      capacity: venue.capacity?.toString() ?? '',
      isActive: venue.isActive,
    })
    setDialog(true)
  }

  const closeDialog = () => {
    setDialog(false)
    setEditingVenue(null)
    setForm({ name: '', address: '', city: '', province: '', country: 'Argentina', googleMapsUrl: '', capacity: '', isActive: true })
  }

  const filteredVenues = venues.filter((v) =>
    search ? v.name.toLowerCase().includes(search.toLowerCase()) : true
  )

  const columns: Column<VenueRow>[] = [
    {
      key: 'name',
      label: 'Cancha',
      render: (v) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{v.name}</p>
            {v.address && <p className="text-xs text-muted-foreground">{v.address}</p>}
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
      render: (v) => <span className="text-sm">{v.capacity ? `${v.capacity} personas` : '-'}</span>,
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (v) =>
        v.isActive ? (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Activa</Badge>
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
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
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
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(v.id)}>
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
        loading={loading}
        emptyMessage="No hay canchas registradas"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVenue ? 'Editar cancha' : 'Nueva cancha'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input placeholder="Ej: Cancha Municipal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input placeholder="Calle 123" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Provincia</Label>
                <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link de Google Maps</Label>
              <Input placeholder="https://maps.google.com/..." value={form.googleMapsUrl} onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Capacidad</Label>
              <Input type="number" placeholder="Cantidad de personas" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Activa</Label>
              <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingVenue ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar cancha"
        description="¿Estás seguro de eliminar esta cancha?"
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
