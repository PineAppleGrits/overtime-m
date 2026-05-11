'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { createTeamAction } from '@/modules/admin/actions/teamActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'

interface Sport {
  id: string
  name: string
}

interface NewTeamContentProps {
  sports: Sport[]
}

export function NewTeamContent({ sports }: NewTeamContentProps) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', logoUrl: '', sportId: '', category: '' })

  const createAction = useServerAction(createTeamAction, {
    successMessage: 'Equipo creado exitosamente',
    onSuccess: () => router.push('/admin/equipos'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const teamName = form.category ? `${form.name} ${form.category}` : form.name
    createAction.execute({
      name: teamName,
      logoUrl: form.logoUrl || undefined,
      sportId: form.sportId,
    })
  }

  return (
    <div>
      <PageHeader
        title="Nuevo equipo"
        description="Crea un equipo manualmente. Los usuarios también pueden crear equipos desde la web."
        backHref="/admin/equipos"
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del equipo</CardTitle>
            <CardDescription>
              Un equipo puede tener categorías: &quot;Barcelona&quot; con categoría &quot;A&quot; se muestra como &quot;Barcelona A&quot;.
              Esto permite que un usuario administre múltiples categorías del mismo equipo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del equipo *</Label>
              <Input id="name" placeholder="Ej: Barcelona" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría del equipo</Label>
              <Input id="category" placeholder="Ej: A, B, C (opcional)" value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))} />
              <p className="text-xs text-muted-foreground">
                Si el equipo tiene subcategorías, el nombre se mostrará como &quot;{form.name || 'Equipo'} {form.category || 'A'}&quot;
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL del logo</Label>
              <Input id="logoUrl" placeholder="https://..." value={form.logoUrl} onChange={(e) => setForm(prev => ({ ...prev, logoUrl: e.target.value }))} />
              <p className="text-xs text-muted-foreground">El logo puede ser compartido entre categorías del mismo equipo</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sportId">Disciplina *</Label>
              <Select value={form.sportId} onValueChange={(v) => setForm(prev => ({ ...prev, sportId: v }))}>
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

        <div className="flex gap-3">
          <Button type="submit" disabled={createAction.isPending}>
            {createAction.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Crear equipo
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/equipos')}>Cancelar</Button>
        </div>
      </form>
    </div>
  )
}
