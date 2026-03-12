'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { createTournamentAction } from '@/modules/admin/actions/tournamentActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'

interface Sport { id: string; name: string; code: string }

interface NewTournamentContentProps {
  sports: Sport[]
}

export function NewTournamentContent({ sports }: NewTournamentContentProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', description: '', sportId: '',
    startDate: '', endDate: '', registrationStartDate: '', registrationEndDate: '',
  })

  const createAction = useServerAction(createTournamentAction, {
    successMessage: 'Torneo creado exitosamente (en borrador)',
    onSuccess: () => router.push('/admin/torneos'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createAction.execute({
      name: form.name,
      description: form.description || undefined,
      sportId: form.sportId,
      startDate: form.startDate,
      endDate: form.endDate,
      registrationStartDate: form.registrationStartDate || undefined,
      registrationEndDate: form.registrationEndDate || undefined,
    })
  }

  return (
    <div>
      <PageHeader
        title="Nuevo torneo"
        description="Se creará en estado borrador. Podrás agregar categorías, zonas y precios antes de publicarlo."
        backHref="/admin/torneos"
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información general</CardTitle>
            <CardDescription>Datos básicos del torneo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" placeholder="Ej: APERTURA 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" placeholder="Descripción del torneo..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sportId">Disciplina *</Label>
              <Select value={form.sportId} onValueChange={(v) => setForm({ ...form, sportId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar disciplina" /></SelectTrigger>
                <SelectContent>
                  {sports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id}>{sport.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fechas del torneo</CardTitle>
            <CardDescription>Período de duración y registro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de inicio *</Label>
                <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de fin *</Label>
                <Input id="endDate" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationStartDate">Inicio inscripciones</Label>
                <Input id="registrationStartDate" type="date" value={form.registrationStartDate} onChange={(e) => setForm({ ...form, registrationStartDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationEndDate">Cierre inscripciones</Label>
                <Input id="registrationEndDate" type="date" value={form.registrationEndDate} onChange={(e) => setForm({ ...form, registrationEndDate: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={createAction.isPending}>
            {createAction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear torneo
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/torneos')}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}
