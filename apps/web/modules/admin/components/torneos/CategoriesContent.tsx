'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react'
import categoryBrowserService from '@/modules/admin/services/browser/categoryService'
import { createCategoryAction, deleteCategoryAction, createZoneAction, deleteZoneAction } from '@/modules/admin/actions/tournamentActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'

interface Sport { id: string; name: string; code: string }

interface CategoryData {
  id: string; name: string; slug: string; sportId: string; teamsPerZone?: number
  zones: { id: string; name: string; slug: string; teams: { id: string; teamId: string; teamName?: string }[] }[]
}

interface CategoriesContentProps {
  tournamentId: string
  initialCategories: { data: CategoryData[]; error: string | null }
  sports: Sport[]
}

export function CategoriesContent({ tournamentId, initialCategories, sports }: CategoriesContentProps) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [catDialog, setCatDialog] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', sportId: '', teamsPerZone: '4' })
  const [zoneDialog, setZoneDialog] = useState<string | null>(null)
  const [zoneName, setZoneName] = useState('')

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['admin', 'categories', tournamentId] }), [qc, tournamentId])

  const { data: categories, isPending, isError } = useQuery({
    queryKey: ['admin', 'categories', tournamentId],
    queryFn: async () => {
      const response = await categoryBrowserService.getCategories(tournamentId)
      return (response.data ?? response ?? []) as CategoryData[]
    },
    initialData: !initialCategories.error ? initialCategories.data : undefined,
  })

  const createCategoryAct = useServerAction(createCategoryAction, {
    successMessage: 'Categoría creada',
    onSuccess: () => { invalidate(); setCatDialog(false); setCatForm({ name: '', sportId: '', teamsPerZone: '4' }) },
  })
  const deleteCategoryAct = useServerAction(deleteCategoryAction, { successMessage: 'Categoría eliminada', onSuccess: invalidate })
  const createZoneAct = useServerAction(createZoneAction, {
    successMessage: 'Zona creada',
    onSuccess: () => { invalidate(); setZoneDialog(null); setZoneName('') },
  })
  const deleteZoneAct = useServerAction(deleteZoneAction, { successMessage: 'Zona eliminada', onSuccess: invalidate })

  const toggleExpand = (id: string) => {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id); else next.add(id)
    setExpanded(next)
  }

  if (initialCategories.error && isError) {
    return (
      <div>
        <PageHeader title="Categorías y Zonas" description="" backHref={`/admin/torneos/${tournamentId}`} />
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar las categorías</p>
          <Button variant="outline" size="sm" onClick={() => invalidate()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const cats = categories ?? []

  return (
    <div>
      <PageHeader
        title="Categorías y Zonas"
        description="Organiza el torneo en categorías y opcionalmente en zonas dentro de cada categoría"
        backHref={`/admin/torneos/${tournamentId}`}
        onCreateClick={() => setCatDialog(true)}
        createLabel="Nueva categoría"
      />

      {isPending && <div className="animate-pulse space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted" />)}</div>}

      {!isPending && cats.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay categorías creadas. Crea la primera categoría para organizar el torneo.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {cats.map((cat) => (
            <Card key={cat.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(cat.id)}>
                    {expanded.has(cat.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  <CardTitle className="text-lg">{cat.name}</CardTitle>
                  <Badge variant="outline">{cat.zones.length} zonas</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => { setZoneDialog(cat.id); setZoneName('') }}>
                    <Plus className="mr-1 h-3 w-3" />Zona
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteCategoryAct.execute({ tournamentId, categoryId: cat.id })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>

              {expanded.has(cat.id) && (
                <CardContent>
                  {cat.zones.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Sin zonas. Los equipos se asignan directamente a la categoría.</p>
                  ) : (
                    <div className="space-y-2">
                      {cat.zones.map((zone) => (
                        <div key={zone.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">{zone.name}</p>
                            <p className="text-sm text-muted-foreground">{zone.teams.length} equipos</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteZoneAct.execute({ categoryId: cat.id, zoneId: zone.id })}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva categoría</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input placeholder="Ej: Categoría A" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Disciplina *</Label>
              <Select value={catForm.sportId} onValueChange={(v) => setCatForm({ ...catForm, sportId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{sports.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Equipos por zona</Label><Input type="number" value={catForm.teamsPerZone} onChange={(e) => setCatForm({ ...catForm, teamsPerZone: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Cancelar</Button>
            <Button onClick={() => createCategoryAct.execute({ tournamentId, name: catForm.name, sportId: catForm.sportId, teamsPerZone: parseInt(catForm.teamsPerZone) || undefined })} disabled={createCategoryAct.isPending}>
              {createCategoryAct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Zone Dialog */}
      <Dialog open={!!zoneDialog} onOpenChange={(open) => !open && setZoneDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva zona</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input placeholder="Ej: Zona A" value={zoneName} onChange={(e) => setZoneName(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneDialog(null)}>Cancelar</Button>
            <Button onClick={() => zoneDialog && createZoneAct.execute({ categoryId: zoneDialog, name: zoneName })} disabled={createZoneAct.isPending}>
              {createZoneAct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
