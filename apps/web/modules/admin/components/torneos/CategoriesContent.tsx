'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { AlertCircle, ChevronDown, ChevronRight, ListChecks, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react'
import categoryBrowserService from '@/modules/admin/services/browser/categoryService'
import { createCategoryAction, updateCategoryAction, deleteCategoryAction, createZoneAction, deleteZoneAction } from '@/modules/admin/actions/tournamentActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'

interface CategoryData {
  id: string; name: string; slug: string; maxTeams?: number; teamsPerZone?: number
  zones: { id: string; name: string; slug: string; teams: { id: string; teamId: string; teamName?: string }[] }[]
}

interface CategoriesContentProps {
  tournamentId: string
  initialCategories: { data: CategoryData[]; error: string | null }
  sports: { id: string; name: string; code: string }[]
}

export function CategoriesContent({ tournamentId, initialCategories }: CategoriesContentProps) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Create category
  const [catDialog, setCatDialog] = useState(false)
  const [catForm, setCatForm] = useState({ name: '' })

  // Edit category
  const [editDialog, setEditDialog] = useState<CategoryData | null>(null)
  const [editForm, setEditForm] = useState({ name: '' })

  // Delete category
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Zone
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
    onSuccess: () => { invalidate(); setCatDialog(false); setCatForm({ name: '' }) },
  })
  const updateCategoryAct = useServerAction(updateCategoryAction, {
    successMessage: 'Categoría actualizada',
    onSuccess: () => { invalidate(); setEditDialog(null) },
  })
  const deleteCategoryAct = useServerAction(deleteCategoryAction, {
    successMessage: 'Categoría eliminada',
    onSuccess: () => { invalidate(); setDeleteId(null) },
  })
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

  const openEdit = (cat: CategoryData) => {
    setEditDialog(cat)
    setEditForm({ name: cat.name })
  }

  if (initialCategories.error && isError) {
    return (
      <div>
        <PageHeader title="Categorías y Zonas" backHref={`/admin/torneos/${tournamentId}`} />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar las categorías</p>
          <Button variant="outline" size="sm" onClick={() => invalidate()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const cats = categories ?? []
  const totalTeams = cats.reduce((acc, c) => acc + c.zones.reduce((a, z) => a + z.teams.length, 0), 0)

  return (
    <div>
      <PageHeader
        title="Categorías y Zonas"
        description="Organizá el torneo en categorías. Los equipos se van asignando a zonas a medida que se inscriben."
        backHref={`/admin/torneos/${tournamentId}`}
        onCreateClick={() => setCatDialog(true)}
        createLabel="Nueva categoría"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/torneos/${tournamentId}/inscripciones`}>
              <ListChecks className="mr-1.5 h-3.5 w-3.5" />
              Inscripciones
            </Link>
          </Button>
        }
      />

      {cats.length > 0 && (
        <div className="mb-4 flex gap-3">
          <Badge variant="outline">{cats.length} categorías</Badge>
          <Badge variant="outline">{cats.reduce((a, c) => a + c.zones.length, 0)} zonas</Badge>
          <Badge variant="outline">{totalTeams} equipos</Badge>
        </div>
      )}

      {isPending && <div className="animate-pulse space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted" />)}</div>}

      {!isPending && cats.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay categorías creadas. Crea la primera categoría para organizar el torneo.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {cats.map((cat) => {
            const teamCount = cat.zones.reduce((a, z) => a + z.teams.length, 0)
            return (
              <Card key={cat.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(cat.id)}>
                      {expanded.has(cat.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    <CardTitle className="text-lg">{cat.name}</CardTitle>
                    <Badge variant="outline">{cat.zones.length} zonas</Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {teamCount}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setZoneDialog(cat.id); setZoneName('') }}>
                      <Plus className="mr-1 h-3 w-3" />Zona
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(cat.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>

                {expanded.has(cat.id) && (
                  <CardContent>
                    {cat.zones.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">Sin zonas. Las zonas se crean a medida que los equipos se inscriben, o podés crearlas manualmente.</p>
                    ) : (
                      <div className="space-y-2">
                        {cat.zones.map((zone) => (
                          <div key={zone.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <p className="font-medium">{zone.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {zone.teams.length} equipos
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {zone.teams.length > 0 && (
                                <div className="flex flex-wrap gap-1 mr-3">
                                  {zone.teams.slice(0, 5).map((t) => (
                                    <Badge key={t.id} variant="outline" className="text-xs">
                                      {t.teamName ?? t.teamId.slice(0, 6)}
                                    </Badge>
                                  ))}
                                  {zone.teams.length > 5 && (
                                    <Badge variant="outline" className="text-xs">+{zone.teams.length - 5}</Badge>
                                  )}
                                </div>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteZoneAct.execute({ categoryId: cat.id, zoneId: zone.id })}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva categoría</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input placeholder="Ej: Primera División, Sub-20" value={catForm.name} onChange={(e) => setCatForm({ name: e.target.value })} />
              <p className="text-xs text-muted-foreground">Las zonas y la asignación de equipos se configuran después, desde el detalle de la categoría.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => createCategoryAct.execute({ tournamentId, name: catForm.name })}
              disabled={createCategoryAct.isPending || !catForm.name}
            >
              {createCategoryAct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar categoría</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ name: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button
              onClick={() => editDialog && updateCategoryAct.execute({
                tournamentId,
                categoryId: editDialog.id,
                name: editForm.name,
              })}
              disabled={updateCategoryAct.isPending || !editForm.name}
            >
              {updateCategoryAct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar categoría"
        description="¿Estás seguro? Se eliminarán todas las zonas y asignaciones de equipos de esta categoría."
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={() => deleteId && deleteCategoryAct.execute({ tournamentId, categoryId: deleteId })}
        loading={deleteCategoryAct.isPending}
      />

      {/* Create Zone Dialog */}
      <Dialog open={!!zoneDialog} onOpenChange={(open) => !open && setZoneDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva zona</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input placeholder="Ej: Zona A" value={zoneName} onChange={(e) => setZoneName(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneDialog(null)}>Cancelar</Button>
            <Button onClick={() => zoneDialog && createZoneAct.execute({ categoryId: zoneDialog, name: zoneName })} disabled={createZoneAct.isPending || !zoneName}>
              {createZoneAct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
