'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export interface VenueRow {
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

interface VenueFormData {
  name: string
  address?: string
  city?: string
  province?: string
  country?: string
  googleMapsUrl?: string
  capacity?: number
  isActive: boolean
}

interface VenueFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingVenue: VenueRow | null
  onSubmit: (data: VenueFormData) => void
  isPending: boolean
}

export function VenueFormDialog({
  open,
  onOpenChange,
  editingVenue,
  onSubmit,
  isPending,
}: VenueFormDialogProps) {
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

  useEffect(() => {
    if (editingVenue) {
      setForm({
        name: editingVenue.name,
        address: editingVenue.address ?? '',
        city: editingVenue.city ?? '',
        province: editingVenue.province ?? '',
        country: editingVenue.country ?? 'Argentina',
        googleMapsUrl: editingVenue.googleMapsUrl ?? '',
        capacity: editingVenue.capacity?.toString() ?? '',
        isActive: editingVenue.isActive,
      })
    } else {
      setForm({
        name: '',
        address: '',
        city: '',
        province: '',
        country: 'Argentina',
        googleMapsUrl: '',
        capacity: '',
        isActive: true,
      })
    }
  }, [editingVenue, open])

  const handleSubmit = () => {
    onSubmit({
      name: form.name,
      address: form.address || undefined,
      city: form.city || undefined,
      province: form.province || undefined,
      country: form.country || undefined,
      googleMapsUrl: form.googleMapsUrl || undefined,
      capacity: form.capacity ? parseInt(form.capacity) : undefined,
      isActive: form.isActive,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingVenue ? 'Editar cancha' : 'Nueva cancha'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              placeholder="Ej: Cancha Municipal"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              placeholder="Calle 123"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Input
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Link de Google Maps</Label>
            <Input
              placeholder="https://maps.google.com/..."
              value={form.googleMapsUrl}
              onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Capacidad</Label>
            <Input
              type="number"
              placeholder="Cantidad de personas"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Activa</Label>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingVenue ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
