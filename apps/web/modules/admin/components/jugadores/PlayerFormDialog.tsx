'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export interface PlayerRow {
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

interface PlayerFormData {
  firstName: string
  lastName: string
  jerseyNumber?: number
  position?: string
  height?: number
  weight?: number
  photoUrl?: string
}

interface PlayerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPlayer: PlayerRow | null
  onSubmit: (data: PlayerFormData) => void
  isPending: boolean
}

export function PlayerFormDialog({ open, onOpenChange, editingPlayer, onSubmit, isPending }: PlayerFormDialogProps) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', jerseyNumber: '', position: '', height: '', weight: '', photoUrl: '',
  })

  useEffect(() => {
    if (editingPlayer) {
      setForm({
        firstName: editingPlayer.firstName,
        lastName: editingPlayer.lastName,
        jerseyNumber: editingPlayer.jerseyNumber?.toString() ?? '',
        position: editingPlayer.position ?? '',
        height: editingPlayer.height?.toString() ?? '',
        weight: editingPlayer.weight?.toString() ?? '',
        photoUrl: editingPlayer.photoUrl ?? '',
      })
    } else {
      setForm({ firstName: '', lastName: '', jerseyNumber: '', position: '', height: '', weight: '', photoUrl: '' })
    }
  }, [editingPlayer, open])

  const handleSubmit = () => {
    onSubmit({
      firstName: form.firstName,
      lastName: form.lastName,
      jerseyNumber: form.jerseyNumber ? parseInt(form.jerseyNumber) : undefined,
      position: form.position || undefined,
      height: form.height ? parseFloat(form.height) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      photoUrl: form.photoUrl || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingPlayer ? 'Editar jugador' : 'Nuevo jugador'}</DialogTitle>
        </DialogHeader>
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingPlayer ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
