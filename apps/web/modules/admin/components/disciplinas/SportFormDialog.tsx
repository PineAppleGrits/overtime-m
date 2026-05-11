'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export interface SportRow {
  id: string
  name: string
  code: string
  description?: string
  createdAt: string
}

interface SportFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingSport: SportRow | null
  onSubmit: (data: { name: string; code: string; description?: string }) => void
  isPending: boolean
}

export function SportFormDialog({
  open,
  onOpenChange,
  editingSport,
  onSubmit,
  isPending,
}: SportFormDialogProps) {
  const [form, setForm] = useState({ name: '', code: '', description: '' })

  useEffect(() => {
    if (editingSport) {
      setForm({
        name: editingSport.name,
        code: editingSport.code,
        description: editingSport.description ?? '',
      })
    } else {
      setForm({ name: '', code: '', description: '' })
    }
  }, [editingSport, open])

  const handleSubmit = () => {
    onSubmit({
      name: form.name,
      code: form.code,
      description: form.description || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingSport ? 'Editar disciplina' : 'Nueva disciplina'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              placeholder="Ej: Básquet"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Código *</Label>
            <Input
              placeholder="Ej: BASKET"
              value={form.code}
              onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Identificador único para uso interno
            </p>
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              placeholder="Descripción opcional..."
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {editingSport ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
