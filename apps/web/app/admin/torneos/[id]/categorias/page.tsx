'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import categoryService from '@/modules/admin/services/browser/categoryService'
import zoneService from '@/modules/admin/services/browser/zoneService'
import sportService from '@/modules/admin/services/browser/sportService'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, ChevronDown, ChevronRight } from 'lucide-react'

interface CategoryData {
  id: string
  name: string
  slug: string
  sportId: string
  playoffFormat?: string
  teamsPerZone?: number
  zones: ZoneData[]
}

interface ZoneData {
  id: string
  name: string
  slug: string
  teams: { id: string; teamId: string; teamName?: string }[]
}

interface Sport {
  id: string
  name: string
  code: string
}

export default function CategoriesPage() {
  const params = useParams()
  const tournamentId = params.id as string

  const [categories, setCategories] = useState<CategoryData[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Category form
  const [catDialog, setCatDialog] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', sportId: '', playoffFormat: 'round_robin', teamsPerZone: '4' })
  const [savingCat, setSavingCat] = useState(false)

  // Zone form
  const [zoneDialog, setZoneDialog] = useState<string | null>(null)
  const [zoneForm, setZoneForm] = useState({ name: '' })
  const [savingZone, setSavingZone] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [catRes, sportRes] = await Promise.all([
        categoryService.getCategories(tournamentId),
        sportService.getSports(),
      ])
      setCategories(catRes.data ?? catRes ?? [])
      setSports(sportRes.data ?? sportRes ?? [])
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleExpand = (catId: string) => {
    const next = new Set(expanded)
    if (next.has(catId)) next.delete(catId)
    else next.add(catId)
    setExpanded(next)
  }

  const handleCreateCategory = async () => {
    if (!catForm.name || !catForm.sportId) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSavingCat(true)
    try {
      await categoryService.createCategory(tournamentId, {
        name: catForm.name,
        sportId: catForm.sportId,
        playoffFormat: catForm.playoffFormat as 'single_elimination' | 'double_elimination' | 'round_robin',
        teamsPerZone: parseInt(catForm.teamsPerZone) || undefined,
      })
      toast.success('Categoría creada')
      setCatDialog(false)
      setCatForm({ name: '', sportId: '', playoffFormat: 'round_robin', teamsPerZone: '4' })
      fetchData()
    } catch {
      toast.error('Error al crear categoría')
    } finally {
      setSavingCat(false)
    }
  }

  const handleDeleteCategory = async (catId: string) => {
    try {
      await categoryService.deleteCategory(tournamentId, catId)
      toast.success('Categoría eliminada')
      fetchData()
    } catch {
      toast.error('Error al eliminar categoría')
    }
  }

  const handleCreateZone = async (categoryId: string) => {
    if (!zoneForm.name) {
      toast.error('Ingresa un nombre para la zona')
      return
    }
    setSavingZone(true)
    try {
      await zoneService.createZone(categoryId, { name: zoneForm.name })
      toast.success('Zona creada')
      setZoneDialog(null)
      setZoneForm({ name: '' })
      fetchData()
    } catch {
      toast.error('Error al crear zona')
    } finally {
      setSavingZone(false)
    }
  }

  const handleDeleteZone = async (categoryId: string, zoneId: string) => {
    try {
      await zoneService.deleteZone(categoryId, zoneId)
      toast.success('Zona eliminada')
      fetchData()
    } catch {
      toast.error('Error al eliminar zona')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Categorías y Zonas"
        description="Organiza el torneo en categorías y opcionalmente en zonas dentro de cada categoría"
        backHref={`/admin/torneos/${tournamentId}`}
        onCreateClick={() => setCatDialog(true)}
        createLabel="Nueva categoría"
      />

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay categorías creadas. Crea la primera categoría para organizar el torneo.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleExpand(cat.id)}
                  >
                    {expanded.has(cat.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <CardTitle className="text-lg">{cat.name}</CardTitle>
                  <Badge variant="outline">{cat.zones.length} zonas</Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoneDialog(cat.id)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Zona
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>

              {expanded.has(cat.id) && (
                <CardContent>
                  {cat.zones.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Sin zonas. Los equipos se asignan directamente a la categoría.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cat.zones.map((zone) => (
                        <div
                          key={zone.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">{zone.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {zone.teams.length} equipos
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteZone(cat.id, zone.id)}
                          >
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
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Categoría A"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Disciplina *</Label>
              <Select value={catForm.sportId} onValueChange={(v) => setCatForm({ ...catForm, sportId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {sports.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato playoff</Label>
              <Select value={catForm.playoffFormat} onValueChange={(v) => setCatForm({ ...catForm, playoffFormat: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="single_elimination">Eliminación simple</SelectItem>
                  <SelectItem value="double_elimination">Eliminación doble</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Equipos por zona</Label>
              <Input
                type="number"
                value={catForm.teamsPerZone}
                onChange={(e) => setCatForm({ ...catForm, teamsPerZone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateCategory} disabled={savingCat}>
              {savingCat && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Zone Dialog */}
      <Dialog open={!!zoneDialog} onOpenChange={(open) => !open && setZoneDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva zona</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="Ej: Zona A"
                value={zoneForm.name}
                onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneDialog(null)}>Cancelar</Button>
            <Button onClick={() => zoneDialog && handleCreateZone(zoneDialog)} disabled={savingZone}>
              {savingZone && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
