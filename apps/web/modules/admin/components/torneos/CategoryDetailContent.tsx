'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertCircle, ListChecks, Loader2, Plus, Trash2, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import categoryBrowserService from '@/modules/admin/services/browser/categoryService'
import {
  createZoneAction, deleteZoneAction,
} from '@/modules/admin/actions/tournamentActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { AdminCategory } from '@/modules/admin/types'

interface CategoryDetailContentProps {
  tournamentId: string
  categoryId: string
  tournamentName: string
  initialCategory: { data: AdminCategory | null; error: string | null }
}

export function CategoryDetailContent({
  tournamentId,
  categoryId,
  tournamentName,
  initialCategory,
}: CategoryDetailContentProps) {
  const qc = useQueryClient()
  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin', 'category', categoryId] })
  }, [qc, categoryId])

  const { data: category, isPending, isError, refetch } = useQuery({
    queryKey: ['admin', 'category', categoryId],
    queryFn: async () => {
      const response = await categoryBrowserService.getCategoryById(tournamentId, categoryId)
      return (response.data ?? response) as AdminCategory
    },
    initialData: !initialCategory.error && initialCategory.data ? initialCategory.data : undefined,
  })

  const [zoneDialog, setZoneDialog] = useState(false)
  const [zoneName, setZoneName] = useState('')
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null)

  const createZoneAct = useServerAction(createZoneAction, {
    successMessage: 'Zona creada',
    onSuccess: () => { invalidate(); setZoneDialog(false); setZoneName('') },
  })
  const deleteZoneAct = useServerAction(deleteZoneAction, {
    successMessage: 'Zona eliminada',
    onSuccess: () => { invalidate(); setDeleteZoneId(null) },
  })

  if (initialCategory.error && isError) {
    return (
      <div>
        <PageHeader title="Categoría" backHref={`/admin/torneos/${tournamentId}`} />
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-[#6b6a72]">Error al cargar la categoría</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  if (isPending || !category) {
    return (
      <div>
        <PageHeader title="Categoría" backHref={`/admin/torneos/${tournamentId}`} />
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-[#e8e6e1]" />
          <div className="h-64 rounded bg-[#e8e6e1]" />
        </div>
      </div>
    )
  }

  const zones = category.zones ?? []
  const totalTeams = zones.reduce((a, z) => a + z.teams.length, 0)

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-8">
        <PageHeader
          title={category.name}
          description={tournamentName}
          backHref={`/admin/torneos/${tournamentId}`}
          actions={
            <Button variant="ghost" size="sm" className="text-[#6b6a72] hover:text-[#0f0e13]" asChild>
              <Link href={`/admin/torneos/${tournamentId}/inscripciones?categoryId=${categoryId}`}>
                <ListChecks className="mr-1.5 h-3.5 w-3.5" />
                Inscripciones
              </Link>
            </Button>
          }
        />
        <div className="flex flex-wrap items-center gap-4 mt-3 text-[13px] text-[#9b99a6]">
          <span>{zones.length} zonas</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />{totalTeams} equipos
          </span>
          {category.teamsPerZone && (
            <>
              <span>·</span>
              <span>{category.teamsPerZone} equipos por zona</span>
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="zonas">
        <TabsList className="bg-transparent p-0 h-auto border-b border-[#f0efe9] rounded-none w-full justify-start gap-0">
          <TabsTrigger
            value="zonas"
            className="rounded-none border-b-2 border-transparent px-4 pb-2.5 pt-1 text-[13px] font-medium text-[#9b99a6] shadow-none data-[state=active]:border-[#ff3b2f] data-[state=active]:text-[#0f0e13] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Zonas
          </TabsTrigger>
          <TabsTrigger
            value="equipos"
            className="rounded-none border-b-2 border-transparent px-4 pb-2.5 pt-1 text-[13px] font-medium text-[#9b99a6] shadow-none data-[state=active]:border-[#ff3b2f] data-[state=active]:text-[#0f0e13] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Equipos
          </TabsTrigger>
        </TabsList>

        {/* ── Zonas tab ── */}
        <TabsContent value="zonas" className="mt-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[13px] text-[#9b99a6]">
              Creá zonas manualmente o se generan al inscribir equipos.
            </p>
            <button
              type="button"
              onClick={() => { setZoneDialog(true); setZoneName('') }}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#ff3b2f] hover:text-[#e5352a] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva zona
            </button>
          </div>

          {zones.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-[13px] text-[#9b99a6]">No hay zonas todavía</p>
              <p className="text-[12px] text-[#c4c2cc] mt-1">Creá la primera zona para empezar a organizar equipos</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="group bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[14px] font-medium text-[#0f0e13]">{zone.name}</p>
                      <p className="text-[12px] text-[#9b99a6] mt-0.5">
                        {zone.teams.length} equipos{category.teamsPerZone ? ` / ${category.teamsPerZone}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteZoneId(zone.id)}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[#c4c2cc] hover:text-destructive" />
                    </button>
                  </div>

                  {zone.teams.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {zone.teams.map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center rounded-md bg-[#f7f6f4] px-2 py-0.5 text-[11px] font-medium text-[#6b6a72]"
                        >
                          {t.teamName || t.teamId.slice(0, 6)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-[#c4c2cc]">Sin equipos asignados</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Equipos tab ── */}
        <TabsContent value="equipos" className="mt-6">
          {totalTeams === 0 ? (
            <div className="py-14 text-center">
              <p className="text-[13px] text-[#9b99a6]">No hay equipos inscriptos todavía</p>
              <p className="text-[12px] text-[#c4c2cc] mt-1">Los equipos aparecerán acá cuando se inscriban</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#f0efe9]">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6]">Equipo</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6]">Zona</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.flatMap((zone) =>
                      zone.teams.map((team) => (
                        <tr
                          key={team.id}
                          className={cn(
                            'border-b border-[#f0efe9] last:border-0 transition-colors hover:bg-[#fafaf8]'
                          )}
                        >
                          <td className="px-5 py-3">
                            <Link
                              href={`/admin/equipos/${team.teamId}`}
                              className="font-medium text-[#0f0e13] hover:text-[#ff3b2f] transition-colors"
                            >
                              {team.teamName || team.teamId.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-[#6b6a72]">
                            {zone.name}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ══════════ DIALOGS ══════════ */}

      <Dialog open={zoneDialog} onOpenChange={setZoneDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva zona</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b6a72]">Nombre *</Label>
              <Input
                placeholder="Ej: Zona A"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                className="border-[#e8e6e1] h-9"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneDialog(false)} className="border-[#e8e6e1]">Cancelar</Button>
            <Button
              disabled={createZoneAct.isPending || !zoneName.trim()}
              onClick={() => createZoneAct.execute({ categoryId, name: zoneName.trim() })}
              className="bg-[#ff3b2f] hover:bg-[#e5352a] text-white"
            >
              {createZoneAct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteZoneId}
        onOpenChange={(open) => !open && setDeleteZoneId(null)}
        title="Eliminar zona"
        description="Se eliminarán todas las asignaciones de equipos en esta zona."
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={() => deleteZoneId && deleteZoneAct.execute({ categoryId, zoneId: deleteZoneId })}
        loading={deleteZoneAct.isPending}
      />
    </div>
  )
}
