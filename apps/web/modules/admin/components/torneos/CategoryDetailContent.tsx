'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertCircle, Calendar, GripVertical, ListChecks, Loader2,
  MapPin, Move, Plus, Trash2, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import categoryBrowserService from '@/modules/admin/services/browser/categoryService'
import registrationBrowserService from '@/modules/admin/services/browser/registrationService'
import matchBrowserService from '@/modules/admin/services/browser/matchService'
import {
  createZoneAction, deleteZoneAction,
  assignTeamToZoneAction, removeTeamFromZoneAction, moveTeamBetweenZonesAction,
} from '@/modules/admin/actions/tournamentActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { AdminCategory, AdminRegistration, FixtureFormat } from '@/modules/admin/types'

interface CategoryDetailContentProps {
  tournamentId: string
  categoryId: string
  tournamentName: string
  tournamentFixtureFormat?: FixtureFormat
  tournamentModality?: string
  initialCategory: { data: AdminCategory | null; error: string | null }
}

interface PoolTeam { teamId: string; teamName: string }

const POOL_ZONE = '__pool__' as const

export function CategoryDetailContent({
  tournamentId,
  categoryId,
  tournamentName,
  tournamentFixtureFormat,
  tournamentModality,
  initialCategory,
}: CategoryDetailContentProps) {
  const qc = useQueryClient()
  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin', 'category', categoryId] })
    qc.invalidateQueries({ queryKey: ['admin', 'category-registrations', tournamentId, categoryId] })
  }, [qc, categoryId, tournamentId])

  const { data: category, isPending, isError, refetch } = useQuery({
    queryKey: ['admin', 'category', categoryId],
    queryFn: async () => {
      const response = await categoryBrowserService.getCategoryById(tournamentId, categoryId)
      return (response.data ?? response) as AdminCategory
    },
    initialData: !initialCategory.error && initialCategory.data ? initialCategory.data : undefined,
  })

  const { data: approvedRegs } = useQuery({
    queryKey: ['admin', 'category-registrations', tournamentId, categoryId],
    queryFn: async () => {
      const response = await registrationBrowserService.getRegistrations({
        tournamentId, categoryId, status: 'approved', page: 1, limit: 200,
      })
      const raw = response.data ?? response
      return (raw.data ?? raw ?? []) as AdminRegistration[]
    },
  })

  const [zoneDialog, setZoneDialog] = useState(false)
  const [zoneName, setZoneName] = useState('')
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null)

  const [draggedTeamId, setDraggedTeamId] = useState<string | null>(null)
  const [draggedFromZoneId, setDraggedFromZoneId] = useState<string | null>(null)
  const [dragOverZoneId, setDragOverZoneId] = useState<string | null>(null)

  const createZoneAct = useServerAction(createZoneAction, {
    successMessage: 'Zona creada',
    onSuccess: () => { invalidate(); setZoneDialog(false); setZoneName('') },
  })
  const deleteZoneAct = useServerAction(deleteZoneAction, {
    successMessage: 'Zona eliminada',
    onSuccess: () => { invalidate(); setDeleteZoneId(null) },
  })
  const assignTeamAct = useServerAction(assignTeamToZoneAction, {
    successMessage: 'Equipo asignado',
    onSuccess: invalidate,
  })
  const removeTeamAct = useServerAction(removeTeamFromZoneAction, {
    successMessage: 'Equipo removido de la zona',
    onSuccess: invalidate,
  })
  const moveTeamAct = useServerAction(moveTeamBetweenZonesAction, {
    successMessage: 'Equipo movido',
    onSuccess: invalidate,
  })

  const zones = category?.zones ?? []
  const totalTeams = zones.reduce((a, z) => a + z.teams.length, 0)

  const poolTeams = useMemo<PoolTeam[]>(() => {
    if (!approvedRegs) return []
    const assignedIds = new Set(zones.flatMap((z) => z.teams.map((t) => t.teamId)))
    return approvedRegs
      .filter((r) => !assignedIds.has(r.teamId))
      .map((r) => ({ teamId: r.teamId, teamName: r.teamName }))
  }, [approvedRegs, zones])

  const handleDragStart = useCallback((teamId: string, fromZoneId: string | null) => {
    setDraggedTeamId(teamId)
    setDraggedFromZoneId(fromZoneId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedTeamId(null)
    setDraggedFromZoneId(null)
    setDragOverZoneId(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault()
    setDragOverZoneId(zoneId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverZoneId(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, toZoneId: string | typeof POOL_ZONE) => {
    e.preventDefault()
    if (!draggedTeamId) return
    const from = draggedFromZoneId
    handleDragEnd()

    if (toZoneId === POOL_ZONE) {
      if (!from) return
      removeTeamAct.execute({ categoryId, zoneId: from, teamId: draggedTeamId })
      return
    }
    if (!from) {
      assignTeamAct.execute({ categoryId, zoneId: toZoneId, teamId: draggedTeamId })
      return
    }
    if (from === toZoneId) return
    moveTeamAct.execute({ categoryId, fromZoneId: from, toZoneId, teamId: draggedTeamId })
  }, [draggedTeamId, draggedFromZoneId, handleDragEnd, categoryId, assignTeamAct, removeTeamAct, moveTeamAct])

  const handleMoveSelect = useCallback((teamId: string, fromZoneId: string | null, toValue: string) => {
    if (toValue === POOL_ZONE) {
      if (fromZoneId) removeTeamAct.execute({ categoryId, zoneId: fromZoneId, teamId })
      return
    }
    if (!fromZoneId) {
      assignTeamAct.execute({ categoryId, zoneId: toValue, teamId })
      return
    }
    if (fromZoneId === toValue) return
    moveTeamAct.execute({ categoryId, fromZoneId, toZoneId: toValue, teamId })
  }, [categoryId, assignTeamAct, removeTeamAct, moveTeamAct])

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
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {tournamentModality && (
            <span className="inline-flex items-center rounded-md bg-[#0f0e13] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              {tournamentModality}
            </span>
          )}
          {tournamentFixtureFormat && (
            <span className="inline-flex items-center rounded-md border border-[#e8e6e1] px-2 py-0.5 text-[11px] font-medium text-[#6b6a72]">
              {tournamentFixtureFormat === 'DOUBLE_ROUND' ? 'Ida y vuelta' : 'Una rueda'}
            </span>
          )}
          <span className="text-[13px] text-[#9b99a6]">
            · {zones.length} zonas · <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{totalTeams} equipos</span>
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="zonas">
        <TabsList className="bg-transparent p-0 h-auto border-b border-[#f0efe9] rounded-none w-full justify-start gap-0 overflow-x-auto">
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
          <TabsTrigger
            value="calendario"
            className="rounded-none border-b-2 border-transparent px-4 pb-2.5 pt-1 text-[13px] font-medium text-[#9b99a6] shadow-none data-[state=active]:border-[#ff3b2f] data-[state=active]:text-[#0f0e13] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Calendario
          </TabsTrigger>
        </TabsList>

        {/* ── Zonas tab ── */}
        <TabsContent value="zonas" className="mt-6">
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <p className="text-[13px] text-[#9b99a6]">
              Arrastrá equipos aprobados a las zonas. En mobile, usá el botón <Move className="inline h-3 w-3" /> del equipo.
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

          <div className="grid gap-4 md:grid-cols-[260px_1fr]">
            {/* Pool of approved teams */}
            <div
              onDragOver={(e) => handleDragOver(e, POOL_ZONE)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, POOL_ZONE)}
              className={cn(
                'bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors',
                dragOverZoneId === POOL_ZONE && 'ring-2 ring-[#ff3b2f] ring-offset-1',
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6]">
                  Aprobados sin zona
                </h3>
                <span className="text-[11px] text-[#9b99a6]">{poolTeams.length}</span>
              </div>
              {poolTeams.length === 0 ? (
                <p className="text-[12px] text-[#c4c2cc] py-4 text-center">
                  {approvedRegs === undefined ? 'Cargando...' : 'No hay equipos pendientes'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {poolTeams.map((t) => (
                    <TeamChip
                      key={t.teamId}
                      teamId={t.teamId}
                      teamName={t.teamName}
                      fromZoneId={null}
                      zones={zones}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onMoveSelect={handleMoveSelect}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Zones */}
            <div>
              {zones.length === 0 ? (
                <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] py-14 text-center">
                  <p className="text-[13px] text-[#9b99a6]">No hay zonas todavía</p>
                  <p className="text-[12px] text-[#c4c2cc] mt-1">Creá la primera zona para empezar a organizar equipos</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      onDragOver={(e) => handleDragOver(e, zone.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, zone.id)}
                      className={cn(
                        'group bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all',
                        dragOverZoneId === zone.id
                          ? 'ring-2 ring-[#ff3b2f] ring-offset-1'
                          : 'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-[14px] font-medium text-[#0f0e13]">{zone.name}</p>
                          <p className="text-[12px] text-[#9b99a6] mt-0.5">
                            {zone.teams.length} equipos
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

                      {zone.teams.length === 0 ? (
                        <p className="text-[12px] text-[#c4c2cc] py-4 text-center border border-dashed border-[#e8e6e1] rounded-md">
                          Soltá equipos acá
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {zone.teams.map((t) => (
                            <TeamChip
                              key={t.id}
                              teamId={t.teamId}
                              teamName={t.teamName || t.teamId.slice(0, 6)}
                              fromZoneId={zone.id}
                              zones={zones}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              onMoveSelect={handleMoveSelect}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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

        {/* ── Calendario tab ── */}
        <TabsContent value="calendario" className="mt-6">
          <CalendarioTab tournamentId={tournamentId} categoryId={categoryId} zones={zones} />
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

// ─── Team Chip (draggable + mobile Select fallback) ─────────────────────────

function TeamChip({
  teamId,
  teamName,
  fromZoneId,
  zones,
  onDragStart,
  onDragEnd,
  onMoveSelect,
}: {
  teamId: string
  teamName: string
  fromZoneId: string | null
  zones: { id: string; name: string }[]
  onDragStart: (teamId: string, fromZoneId: string | null) => void
  onDragEnd: () => void
  onMoveSelect: (teamId: string, fromZoneId: string | null, toValue: string) => void
}) {
  const [moveOpen, setMoveOpen] = useState(false)
  const otherZones = zones.filter((z) => z.id !== fromZoneId)

  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart(teamId, fromZoneId) }}
      onDragEnd={onDragEnd}
      className="group flex items-center gap-1.5 rounded-md border border-[#e8e6e1] bg-white hover:border-[#d0cec9] px-2 py-1.5 cursor-grab active:cursor-grabbing transition-colors"
    >
      <GripVertical className="h-3.5 w-3.5 text-[#c4c2cc] shrink-0" />
      <span className="text-[12px] font-medium text-[#0f0e13] truncate flex-1">{teamName}</span>

      <Select
        open={moveOpen}
        onOpenChange={setMoveOpen}
        value=""
        onValueChange={(v) => { setMoveOpen(false); onMoveSelect(teamId, fromZoneId, v) }}
      >
        <SelectTrigger
          className="md:opacity-0 md:group-hover:opacity-100 h-6 w-6 p-0 border-0 bg-transparent shadow-none [&>svg]:hidden transition-opacity"
          aria-label="Mover a otra zona"
          onClick={(e) => e.stopPropagation()}
        >
          <Move className="h-3.5 w-3.5 text-[#9b99a6]" />
        </SelectTrigger>
        <SelectContent>
          {fromZoneId && (
            <SelectItem value={POOL_ZONE}>
              <span className="text-[12px]">Quitar de zona</span>
            </SelectItem>
          )}
          {otherZones.length === 0 && !fromZoneId && (
            <div className="px-2 py-1.5 text-[11px] text-[#9b99a6]">Creá una zona primero</div>
          )}
          {otherZones.map((z) => (
            <SelectItem key={z.id} value={z.id}>
              <span className="text-[12px]">Mover a {z.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ─── Calendario Tab ──────────────────────────────────────────────────────────

interface MatchRow {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeamName?: string
  awayTeamName?: string
  homeTeam?: { id: string; name: string }
  awayTeam?: { id: string; name: string }
  matchDate: string
  matchTime?: string | null
  status: string
  zoneId?: string | null
  zone?: { id: string; name: string } | null
  venueName?: string | null
  venue?: { id: string; name: string } | null
  homeScore?: number | null
  awayScore?: number | null
}

function CalendarioTab({
  tournamentId,
  categoryId,
  zones,
}: {
  tournamentId: string
  categoryId: string
  zones: { id: string; name: string }[]
}) {
  const [zoneFilter, setZoneFilter] = useState<string>('all')

  const { data: matches, isPending, isError, refetch } = useQuery({
    queryKey: ['admin', 'category-matches', tournamentId, categoryId, zoneFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { categoryId, page: 1, limit: 200 }
      if (zoneFilter !== 'all') params.zoneId = zoneFilter
      const response = await matchBrowserService.getMatches(params as never)
      const raw = response.data ?? response
      return (raw.data ?? raw ?? []) as MatchRow[]
    },
  })

  const grouped = useMemo(() => {
    const all = matches ?? []
    const map = new Map<string, MatchRow[]>()
    for (const m of all) {
      const key = m.matchDate?.slice(0, 10) ?? 'sin-fecha'
      const list = map.get(key) ?? []
      list.push(m)
      map.set(key, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [matches])

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <p className="text-[13px] text-[#9b99a6]">
          Partidos programados de esta categoría.
        </p>
        <Select value={zoneFilter} onValueChange={setZoneFilter}>
          <SelectTrigger className="w-[180px] h-9 border-[#e8e6e1] bg-white">
            <SelectValue placeholder="Todas las zonas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las zonas</SelectItem>
            {zones.map((z) => (
              <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-20 rounded-xl bg-[#e8e6e1]" />
          <div className="h-20 rounded-xl bg-[#e8e6e1]" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-[#6b6a72] text-[13px]">No se pudieron cargar los partidos</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      ) : grouped.length === 0 ? (
        <div className="py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f7f6f4]">
            <Calendar className="h-5 w-5 text-[#c4c2cc]" />
          </div>
          <p className="text-[13px] text-[#9b99a6]">No hay partidos programados</p>
          <p className="text-[12px] text-[#c4c2cc] mt-1">Se mostrarán acá cuando se genere el fixture</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-3.5 w-3.5 text-[#9b99a6]" />
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6]">
                  {formatDate(date)}
                </h3>
              </div>
              <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] divide-y divide-[#f0efe9]">
                {items.map((m) => (
                  <Link
                    key={m.id}
                    href={`/admin/torneos/${tournamentId}/partidos/${m.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#fafaf8] transition-colors"
                  >
                    <div className="w-14 shrink-0 text-[12px] font-semibold text-[#0f0e13]">
                      {m.matchTime ?? '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#0f0e13] truncate">
                        {(m.homeTeamName ?? m.homeTeam?.name ?? '?')} <span className="text-[#c4c2cc]">vs</span> {(m.awayTeamName ?? m.awayTeam?.name ?? '?')}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#9b99a6]">
                        {m.zone?.name && <span>{m.zone.name}</span>}
                        {(m.venueName || m.venue?.name) && (
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {m.venueName ?? m.venue?.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {m.status === 'finalizado' && m.homeScore != null && m.awayScore != null ? (
                      <div className="text-[13px] font-bold text-[#0f0e13] tabular-nums">
                        {m.homeScore}–{m.awayScore}
                      </div>
                    ) : (
                      <StatusPill status={m.status} />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  if (iso === 'sin-fecha') return 'Sin fecha'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    programado: { label: 'Programado', cls: 'bg-[#f7f6f4] text-[#6b6a72]' },
    en_curso: { label: 'En curso', cls: 'bg-emerald-50 text-emerald-700' },
    suspendido: { label: 'Suspendido', cls: 'bg-amber-50 text-amber-700' },
    cancelado: { label: 'Cancelado', cls: 'bg-red-50 text-red-700' },
    reprogramado: { label: 'Reprogramado', cls: 'bg-amber-50 text-amber-700' },
    finalizado: { label: 'Finalizado', cls: 'bg-[#0f0e13] text-white' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-[#f7f6f4] text-[#6b6a72]' }
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium', s.cls)}>
      {s.label}
    </span>
  )
}
