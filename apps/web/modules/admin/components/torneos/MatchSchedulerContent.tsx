'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  GripVertical,
  Calendar,
  MapPin,
  Check,
  Save,
  Send,
  Loader2,
  X,
  UserCheck,
  Gavel,
  Video,
  ClipboardList,
  Plus,
  UserPlus,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatchItem {
  id: string
  homeTeam: string
  awayTeam: string
  categoryName: string
  categoryColor: string
}

interface StaffAssignment {
  refereeIds: string[]
  officialIds: string[]
  multimediaIds: string[]
}

interface ScheduledMatch extends MatchItem {
  day: 'saturday' | 'sunday'
  timeSlot: string
  staff: StaffAssignment
}

type FechaStatus = 'draft' | 'published'

interface Fecha {
  id: string
  label: string
  number: number
}

interface Cancha {
  id: string
  name: string
  venueName: string
}

interface StaffMember {
  id: string
  name: string
  role: 'arbitro' | 'agente_mesa' | 'multimedia'
  specialty?: string // "Fotografía", "Video", etc.
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_FECHAS: Fecha[] = [
  { id: 'f1', label: 'Fecha 1', number: 1 },
  { id: 'f2', label: 'Fecha 2', number: 2 },
  { id: 'f3', label: 'Fecha 3', number: 3 },
  { id: 'f4', label: 'Fecha 4', number: 4 },
  { id: 'f5', label: 'Fecha 5', number: 5 },
]

const MOCK_CANCHAS: Cancha[] = [
  { id: 'c1', name: 'Cancha 1', venueName: 'Sede UGAB' },
  { id: 'c2', name: 'Cancha 2', venueName: 'Sede UGAB' },
  { id: 'c3', name: 'Cancha Principal', venueName: 'Complejo Norte' },
]

const MOCK_STAFF: StaffMember[] = [
  { id: 's1', name: 'Carlos Méndez', role: 'arbitro' },
  { id: 's2', name: 'Lucía Romero', role: 'arbitro' },
  { id: 's3', name: 'Martín Suárez', role: 'arbitro' },
  { id: 's4', name: 'Roberto Díaz', role: 'arbitro' },
  { id: 's5', name: 'Ana García', role: 'agente_mesa' },
  { id: 's6', name: 'Pablo Fernández', role: 'agente_mesa' },
  { id: 's7', name: 'Sofía López', role: 'agente_mesa' },
  { id: 's8', name: 'Diego Torres', role: 'multimedia', specialty: 'Fotografía' },
  { id: 's9', name: 'Valentina Ruiz', role: 'multimedia', specialty: 'Fotografía' },
  { id: 's10', name: 'Tomás Herrera', role: 'multimedia', specialty: 'Video' },
  { id: 's11', name: 'Camila Paz', role: 'multimedia', specialty: 'Video' },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Primera A Elite': 'bg-blue-600',
  'Primera B Azul': 'bg-sky-500',
  'Primera D Rojo': 'bg-red-500',
  'Senior Master': 'bg-amber-600',
  'Segunda División': 'bg-emerald-600',
  'Primera División': 'bg-violet-600',
}

function getCategoryColor(name: string) {
  return CATEGORY_COLORS[name] ?? 'bg-gray-500'
}

const MOCK_MATCHES: MatchItem[] = [
  { id: 'um1', homeTeam: 'Los Halcones FC', awayTeam: 'Deportivo Norte', categoryName: 'Primera D Rojo', categoryColor: getCategoryColor('Primera D Rojo') },
  { id: 'um2', homeTeam: 'Atlético San Telmo', awayTeam: 'Villa Real United', categoryName: 'Primera B Azul', categoryColor: getCategoryColor('Primera B Azul') },
  { id: 'um3', homeTeam: 'Club Social', awayTeam: 'Rangers Senior', categoryName: 'Senior Master', categoryColor: getCategoryColor('Senior Master') },
  { id: 'um4', homeTeam: 'Titanes del Sur', awayTeam: 'Pumas FC', categoryName: 'Primera A Elite', categoryColor: getCategoryColor('Primera A Elite') },
  { id: 'um5', homeTeam: 'Ciclón FC', awayTeam: 'Sportivo Huracán', categoryName: 'Primera A Elite', categoryColor: getCategoryColor('Primera A Elite') },
  { id: 'um6', homeTeam: 'Los Pumas', awayTeam: 'Tigres FC', categoryName: 'Primera División', categoryColor: getCategoryColor('Primera División') },
  { id: 'um7', homeTeam: 'Leones', awayTeam: 'Panthers', categoryName: 'Primera División', categoryColor: getCategoryColor('Primera División') },
  { id: 'um8', homeTeam: 'Halcones', awayTeam: 'Buitres', categoryName: 'Segunda División', categoryColor: getCategoryColor('Segunda División') },
  { id: 'um9', homeTeam: 'Cóndores', awayTeam: 'Ñandúes', categoryName: 'Segunda División', categoryColor: getCategoryColor('Segunda División') },
  { id: 'um10', homeTeam: 'Jaguares', awayTeam: 'Los Pumas B', categoryName: 'Senior Master', categoryColor: getCategoryColor('Senior Master') },
]

const TIME_SLOTS = [
  '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30',
]

const EMPTY_STAFF: StaffAssignment = { refereeIds: [], officialIds: [], multimediaIds: [] }

const STAFF_ROLE_CONFIG = {
  arbitro: { label: 'Árbitros', icon: Gavel, colorText: 'text-blue-600', colorBg: 'bg-blue-50', colorBorder: 'border-blue-200', field: 'refereeIds' as const },
  agente_mesa: { label: 'Oficiales de mesa', icon: ClipboardList, colorText: 'text-amber-600', colorBg: 'bg-amber-50', colorBorder: 'border-amber-200', field: 'officialIds' as const },
  multimedia: { label: 'Multimedia', icon: Video, colorText: 'text-violet-600', colorBg: 'bg-violet-50', colorBorder: 'border-violet-200', field: 'multimediaIds' as const },
} as const

// ─── Helpers ────────────────────────────────────────────────────────────────

function hasMinimumStaff(staff: StaffAssignment): boolean {
  return staff.refereeIds.length > 0 && staff.officialIds.length > 0
}

function totalStaffCount(staff: StaffAssignment): number {
  return staff.refereeIds.length + staff.officialIds.length + staff.multimediaIds.length
}

function staffLabel(staff: StaffAssignment): string {
  const total = totalStaffCount(staff)
  if (total === 0) return 'Asignar personal'
  const parts: string[] = []
  if (staff.refereeIds.length > 0) parts.push(`${staff.refereeIds.length} árb`)
  if (staff.officialIds.length > 0) parts.push(`${staff.officialIds.length} ofi`)
  if (staff.multimediaIds.length > 0) parts.push(`${staff.multimediaIds.length} med`)
  return parts.join(' · ')
}

// ─── Component ───────────────────────────────────────────────────────────────

interface MatchSchedulerContentProps {
  tournamentId: string
  embedded?: boolean
}

export function MatchSchedulerContent({ tournamentId, embedded = false }: MatchSchedulerContentProps) {
  const [selectedFecha, setSelectedFecha] = useState<string>(MOCK_FECHAS[0].id)
  const [selectedCancha, setSelectedCancha] = useState<string>(MOCK_CANCHAS[0].id)
  const [scheduledMatches, setScheduledMatches] = useState<ScheduledMatch[]>([])
  const [draggedMatch, setDraggedMatch] = useState<MatchItem | ScheduledMatch | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<{ day: 'saturday' | 'sunday'; timeSlot: string } | null>(null)

  // ─── Staff assignment panel ────────────────────────────────────────────
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const selectedScheduledMatch = scheduledMatches.find(m => m.id === selectedMatchId) ?? null

  // ─── Draft / Publish per fecha ──────────────────────────────────────────
  const [fechaStatuses, setFechaStatuses] = useState<Record<string, FechaStatus>>(
    () => Object.fromEntries(MOCK_FECHAS.map(f => [f.id, 'draft' as FechaStatus]))
  )

  // ─── Dirty state tracking ──────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const pendingFechaChange = useRef<string | null>(null)

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const currentFecha = MOCK_FECHAS.find(f => f.id === selectedFecha)
  const currentCancha = MOCK_CANCHAS.find(c => c.id === selectedCancha)
  const currentFechaStatus = fechaStatuses[selectedFecha] ?? 'draft'

  const scheduledIds = new Set(scheduledMatches.map(m => m.id))
  const unscheduledMatches = MOCK_MATCHES.filter(m => !scheduledIds.has(m.id))

  const referees = MOCK_STAFF.filter(s => s.role === 'arbitro')
  const officials = MOCK_STAFF.filter(s => s.role === 'agente_mesa')
  const multimedia = MOCK_STAFF.filter(s => s.role === 'multimedia')

  // ─── Save & Publish ─────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    // TODO: conectar con API
    await new Promise(r => setTimeout(r, 600))
    setIsDirty(false)
    setIsSaving(false)
    toast.success('Cambios guardados como borrador')
  }, [])

  const handlePublish = useCallback(async () => {
    const missingStaff = scheduledMatches.filter(m => !hasMinimumStaff(m.staff))
    if (missingStaff.length > 0) {
      toast.error(`${missingStaff.length} partido(s) sin árbitro u oficial de mesa asignado`)
      return
    }

    setIsPublishing(true)
    // TODO: conectar con API
    await new Promise(r => setTimeout(r, 600))
    setFechaStatuses(prev => ({ ...prev, [selectedFecha]: 'published' }))
    setIsDirty(false)
    setIsPublishing(false)
    toast.success(`${currentFecha?.label} publicada`)
  }, [selectedFecha, currentFecha, scheduledMatches])

  // ─── Fecha change with unsaved guard ────────────────────────────────────

  const handleFechaChange = useCallback((newFechaId: string) => {
    if (isDirty) {
      pendingFechaChange.current = newFechaId
      setShowUnsavedDialog(true)
    } else {
      setSelectedFecha(newFechaId)
      setSelectedMatchId(null)
    }
  }, [isDirty])

  const confirmDiscardChanges = useCallback(() => {
    setIsDirty(false)
    setSelectedMatchId(null)
    if (pendingFechaChange.current) {
      setSelectedFecha(pendingFechaChange.current)
      pendingFechaChange.current = null
    }
    setShowUnsavedDialog(false)
  }, [])

  // ─── Staff assignment (1:N) ─────────────────────────────────────────────

  const addStaff = useCallback((matchId: string, field: keyof StaffAssignment, staffId: string) => {
    setScheduledMatches(prev =>
      prev.map(m => {
        if (m.id !== matchId) return m
        const current = m.staff[field]
        if (current.includes(staffId)) return m
        return { ...m, staff: { ...m.staff, [field]: [...current, staffId] } }
      })
    )
    setIsDirty(true)
  }, [])

  const removeStaff = useCallback((matchId: string, field: keyof StaffAssignment, staffId: string) => {
    setScheduledMatches(prev =>
      prev.map(m => {
        if (m.id !== matchId) return m
        return { ...m, staff: { ...m.staff, [field]: m.staff[field].filter(id => id !== staffId) } }
      })
    )
    setIsDirty(true)
  }, [])

  // ─── Drag & Drop (sidebar → grid AND grid → grid rearrange) ────────────

  const handleDragStart = useCallback((match: MatchItem | ScheduledMatch) => {
    setDraggedMatch(match)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, day: 'saturday' | 'sunday', timeSlot: string) => {
    e.preventDefault()
    setDragOverSlot({ day, timeSlot })
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverSlot(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, day: 'saturday' | 'sunday', timeSlot: string) => {
    e.preventDefault()
    setDragOverSlot(null)
    if (!draggedMatch) return

    const isAlreadyScheduled = scheduledMatches.some(m => m.id === draggedMatch.id)
    const occupant = scheduledMatches.find(m => m.day === day && m.timeSlot === timeSlot)

    if (isAlreadyScheduled) {
      // Rearranging within grid
      const dragged = scheduledMatches.find(m => m.id === draggedMatch.id)!

      if (occupant && occupant.id !== draggedMatch.id) {
        // Swap: the occupant takes the dragged match's old slot
        setScheduledMatches(prev =>
          prev.map(m => {
            if (m.id === draggedMatch.id) return { ...m, day, timeSlot }
            if (m.id === occupant.id) return { ...m, day: dragged.day, timeSlot: dragged.timeSlot }
            return m
          })
        )
      } else if (!occupant) {
        // Move to empty slot
        setScheduledMatches(prev =>
          prev.map(m => m.id === draggedMatch.id ? { ...m, day, timeSlot } : m)
        )
      }
    } else {
      // Dropping from sidebar
      if (occupant) return // Can't drop on occupied slot from sidebar
      setScheduledMatches(prev => [...prev, { ...draggedMatch, day, timeSlot, staff: { ...EMPTY_STAFF } }])
    }

    setIsDirty(true)
    setDraggedMatch(null)
  }, [draggedMatch, scheduledMatches])

  const removeFromSchedule = useCallback((matchId: string) => {
    setScheduledMatches(prev => prev.filter(m => m.id !== matchId))
    if (selectedMatchId === matchId) setSelectedMatchId(null)
    setIsDirty(true)
  }, [selectedMatchId])

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-0">
      {!embedded ? (
        <PageHeader
          title="Partidos"
          description="Organizá los partidos del torneo y asigná árbitros, oficiales y multimedia"
          backHref={`/admin/torneos/${tournamentId}`}
          actions={
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-[12px] text-amber-600 font-medium mr-1">Cambios sin guardar</span>
              )}
              <Button variant="outline" size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
                {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                Guardar borrador
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={isPublishing || scheduledMatches.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isPublishing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
                Publicar fecha
              </Button>
            </div>
          }
        />
      ) : (
        <div className="flex items-center justify-between mb-6">
          <p className="text-[13px] text-[#9b99a6]">Organizá los partidos del torneo y asigná árbitros, oficiales y multimedia</p>
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-[12px] text-amber-600 font-medium mr-1">Cambios sin guardar</span>
            )}
            <Button variant="outline" size="sm" onClick={handleSave} disabled={!isDirty || isSaving} className="border-[#e8e6e1]">
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              Guardar borrador
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing || scheduledMatches.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPublishing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              Publicar fecha
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        title="Cambios sin guardar"
        description="Tenés cambios sin guardar en esta fecha. Si cambiás de fecha, se van a perder. ¿Querés continuar?"
        confirmLabel="Descartar cambios"
        cancelLabel="Seguir editando"
        variant="destructive"
        onConfirm={confirmDiscardChanges}
      />

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#9b99a6]">Fecha</label>
          <Select value={selectedFecha} onValueChange={handleFechaChange}>
            <SelectTrigger className="w-[200px] h-9 bg-white border-[#e8e6e1]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_FECHAS.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  <span className="flex items-center gap-2">
                    {f.label}
                    <span className={cn(
                      'inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none',
                      fechaStatuses[f.id] === 'published'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-[#f0ede8] text-[#6b6a72]'
                    )}>
                      {fechaStatuses[f.id] === 'published' ? 'Publicada' : 'Borrador'}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#9b99a6]">Cancha</label>
          <Select value={selectedCancha} onValueChange={setSelectedCancha}>
            <SelectTrigger className="w-[220px] h-9 bg-white border-[#e8e6e1]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_CANCHAS.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3 text-[#9b99a6]" />
                    {c.name} — {c.venueName}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-end gap-2">
          <Badge variant="outline" className={cn(
            'h-7 text-[11px] font-medium px-2.5',
            currentFechaStatus === 'published'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          )}>
            {currentFechaStatus === 'published' ? 'Publicada' : 'Borrador'}
          </Badge>
          <Badge variant="outline" className="h-7 border-[#e8e6e1] bg-[#f7f6f4] text-[#6b6a72] text-[11px] font-medium px-2.5">
            {unscheduledMatches.length} sin asignar
          </Badge>
          <Badge variant="outline" className="h-7 border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2.5">
            {scheduledMatches.length} asignados
          </Badge>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-4 items-start" style={{ height: 'calc(100vh - 240px)' }}>
        {/* ─── Left: Unscheduled Matches ─── */}
        <div className="w-[260px] shrink-0 flex flex-col rounded-xl border border-[#e8e6e1] bg-white overflow-hidden h-full">
          <div className="px-3 py-2.5 border-b border-[#e8e6e1] bg-[#f7f6f4]">
            <h3 className="text-[12px] font-semibold text-[#0f0e13] uppercase tracking-wide">
              Partidos sin asignar
            </h3>
            <p className="text-[11px] text-[#9b99a6] mt-0.5">Arrastrá al calendario</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {unscheduledMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 mb-2">
                  <Check className="size-5 text-emerald-600" />
                </div>
                <p className="text-[12px] font-medium text-[#6b6a72]">Todos asignados</p>
                <p className="text-[11px] text-[#9b99a6] mt-0.5">Podés reorganizarlos arrastrando</p>
              </div>
            ) : (
              unscheduledMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onDragStart={() => handleDragStart(match)}
                />
              ))
            )}
          </div>
        </div>

        {/* ─── Center: Schedule Grid ─── */}
        <div className="flex-1 rounded-xl border border-[#e8e6e1] bg-white overflow-hidden h-full flex flex-col min-w-0">
          <Tabs defaultValue="both" className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e8e6e1] bg-[#f7f6f4]">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-[#9b99a6]" />
                <span className="text-[12px] font-semibold text-[#0f0e13]">
                  {currentFecha?.label} — {currentCancha?.name}
                </span>
              </div>
              <TabsList className="h-8 bg-white border border-[#e8e6e1]">
                <TabsTrigger value="both" className="text-[11px] h-6 px-3">Sáb + Dom</TabsTrigger>
                <TabsTrigger value="saturday" className="text-[11px] h-6 px-3">Sábado</TabsTrigger>
                <TabsTrigger value="sunday" className="text-[11px] h-6 px-3">Domingo</TabsTrigger>
              </TabsList>
            </div>

            {(['both', 'saturday', 'sunday'] as const).map(tab => (
              <TabsContent key={tab} value={tab} className="flex-1 overflow-y-auto m-0">
                {tab === 'both' ? (
                  <div className="grid grid-cols-2 divide-x divide-[#e8e6e1] h-full">
                    <DayColumn day="saturday" label="Sábado" {...dayColumnProps()} />
                    <DayColumn day="sunday" label="Domingo" {...dayColumnProps()} />
                  </div>
                ) : (
                  <DayColumn
                    day={tab}
                    label={tab === 'saturday' ? 'Sábado' : 'Domingo'}
                    {...dayColumnProps()}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* ─── Right: Staff Assignment Panel ─── */}
        <div className={cn(
          'shrink-0 flex flex-col rounded-xl border border-[#e8e6e1] bg-white overflow-hidden h-full transition-all duration-200',
          selectedScheduledMatch ? 'w-[300px] opacity-100' : 'w-0 opacity-0 border-0'
        )}>
          {selectedScheduledMatch && (
            <StaffPanel
              match={selectedScheduledMatch}
              referees={referees}
              officials={officials}
              multimedia={multimedia}
              onAddStaff={addStaff}
              onRemoveStaff={removeStaff}
              onClose={() => setSelectedMatchId(null)}
            />
          )}
        </div>
      </div>
    </div>
  )

  function dayColumnProps() {
    return {
      tournamentId,
      scheduledMatches,
      dragOverSlot,
      draggedMatchId: draggedMatch?.id ?? null,
      selectedMatchId,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onDragStart: handleDragStart,
      onRemove: removeFromSchedule,
      onSelectMatch: setSelectedMatchId,
    }
  }
}

// ─── Staff Panel ────────────────────────────────────────────────────────────

function StaffPanel({
  match,
  referees,
  officials,
  multimedia,
  onAddStaff,
  onRemoveStaff,
  onClose,
}: {
  match: ScheduledMatch
  referees: StaffMember[]
  officials: StaffMember[]
  multimedia: StaffMember[]
  onAddStaff: (matchId: string, field: keyof StaffAssignment, staffId: string) => void
  onRemoveStaff: (matchId: string, field: keyof StaffAssignment, staffId: string) => void
  onClose: () => void
}) {
  const complete = hasMinimumStaff(match.staff)

  return (
    <>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[#e8e6e1] bg-[#f7f6f4] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <UserCheck className="size-3.5 text-[#9b99a6]" />
            <h3 className="text-[12px] font-semibold text-[#0f0e13] uppercase tracking-wide">
              Asignar personal
            </h3>
          </div>
          <button
            onClick={onClose}
            className="size-5 rounded flex items-center justify-center text-[#9b99a6] hover:text-[#0f0e13] hover:bg-[#e8e6e1] transition-all"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <div className="mt-1.5">
          <div className="flex items-center gap-1.5">
            <span className={cn('inline-block size-2 rounded-full shrink-0', match.categoryColor)} />
            <span className="text-[11px] font-medium text-[#0f0e13] truncate">{match.categoryName}</span>
          </div>
          <p className="text-[11px] text-[#6b6a72] mt-0.5 truncate">
            {match.homeTeam} vs {match.awayTeam}
          </p>
          <p className="text-[10px] text-[#9b99a6] mt-0.5">
            {match.day === 'saturday' ? 'Sábado' : 'Domingo'} · {match.timeSlot}
          </p>
        </div>
      </div>

      {/* Staff sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <StaffMultiSelect
          role="arbitro"
          matchId={match.id}
          assignedIds={match.staff.refereeIds}
          staff={referees}
          field="refereeIds"
          onAdd={onAddStaff}
          onRemove={onRemoveStaff}
        />

        <StaffMultiSelect
          role="agente_mesa"
          matchId={match.id}
          assignedIds={match.staff.officialIds}
          staff={officials}
          field="officialIds"
          onAdd={onAddStaff}
          onRemove={onRemoveStaff}
        />

        <StaffMultiSelect
          role="multimedia"
          matchId={match.id}
          assignedIds={match.staff.multimediaIds}
          staff={multimedia}
          field="multimediaIds"
          onAdd={onAddStaff}
          onRemove={onRemoveStaff}
        />
      </div>

      {/* Footer status */}
      <div className="px-3 py-2.5 border-t border-[#e8e6e1] bg-[#fafaf8] shrink-0">
        <div className="flex items-center gap-2">
          <div className={cn(
            'size-2 rounded-full shrink-0',
            complete ? 'bg-emerald-500' : 'bg-amber-500'
          )} />
          <span className="text-[11px] font-medium text-[#6b6a72]">
            {complete ? 'Personal mínimo asignado' : 'Falta árbitro u oficial de mesa'}
          </span>
        </div>
        <p className="text-[10px] text-[#9b99a6] mt-1">
          {match.staff.refereeIds.length} árb · {match.staff.officialIds.length} ofi · {match.staff.multimediaIds.length} multimedia
        </p>
      </div>
    </>
  )
}

// ─── Staff Multi-Select ──────────────────────────────────────────────────────

function StaffMultiSelect({
  role,
  matchId,
  assignedIds,
  staff,
  field,
  onAdd,
  onRemove,
}: {
  role: keyof typeof STAFF_ROLE_CONFIG
  matchId: string
  assignedIds: string[]
  staff: StaffMember[]
  field: keyof StaffAssignment
  onAdd: (matchId: string, field: keyof StaffAssignment, staffId: string) => void
  onRemove: (matchId: string, field: keyof StaffAssignment, staffId: string) => void
}) {
  const config = STAFF_ROLE_CONFIG[role]
  const Icon = config.icon
  const available = staff.filter(s => !assignedIds.includes(s.id))
  const assigned = staff.filter(s => assignedIds.includes(s.id))

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className={cn('size-3.5', config.colorText)} />
        <span className="text-[11px] font-semibold text-[#6b6a72] uppercase tracking-wider">{config.label}</span>
        {assigned.length > 0 && (
          <span className={cn('ml-auto text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center', config.colorBg, config.colorText)}>
            {assigned.length}
          </span>
        )}
      </div>

      {/* Assigned tags */}
      {assigned.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {assigned.map(s => (
            <span
              key={s.id}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
                config.colorBg, config.colorBorder, config.colorText,
              )}
            >
              {s.name}
              {s.specialty && <span className="opacity-60 text-[9px]">({s.specialty})</span>}
              <button
                onClick={() => onRemove(matchId, field, s.id)}
                className="ml-0.5 rounded hover:bg-black/5 transition-colors"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add dropdown */}
      {available.length > 0 && (
        <Select
          value="__add__"
          onValueChange={(v) => {
            if (v !== '__add__') onAdd(matchId, field, v)
          }}
        >
          <SelectTrigger className="h-8 text-[11px] bg-white border-dashed border-[#d0cec9] text-[#9b99a6] hover:border-[#9b99a6] transition-colors">
            <div className="flex items-center gap-1.5">
              <Plus className="size-3" />
              <span>Agregar {config.label.toLowerCase().replace(/s$/, '')}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {available.map(s => (
              <SelectItem key={s.id} value={s.id}>
                <span className="flex items-center gap-1.5">
                  {s.name}
                  {s.specialty && <span className="text-[#9b99a6] text-[10px]">({s.specialty})</span>}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {available.length === 0 && assigned.length > 0 && (
        <p className="text-[10px] text-[#9b99a6] italic">No quedan más disponibles</p>
      )}
    </div>
  )
}

// ─── Match Card (draggable) ──────────────────────────────────────────────────

function MatchCard({
  match,
  onDragStart,
  compact,
  onRemove,
  onSelect,
  isSelected,
  staffInfo,
  isDragTarget,
  detailHref,
}: {
  match: MatchItem
  onDragStart: () => void
  compact?: boolean
  onRemove?: () => void
  onSelect?: () => void
  isSelected?: boolean
  staffInfo?: { label: string; complete: boolean; total: number }
  isDragTarget?: boolean
  detailHref?: string
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation()
        onDragStart()
      }}
      onClick={onSelect}
      className={cn(
        'group relative flex items-center gap-2 rounded-lg border bg-white transition-all hover:shadow-sm',
        compact ? 'px-2 py-1.5' : 'px-2.5 py-2',
        isSelected
          ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-400/30'
          : isDragTarget
            ? 'border-red-400 bg-red-50/30'
            : 'border-[#e8e6e1] hover:border-[#d0cec9]',
        'cursor-grab active:cursor-grabbing',
      )}
    >
      <GripVertical className={cn('shrink-0 text-[#c4c2cc]', compact ? 'size-3' : 'size-3.5')} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={cn('inline-block size-2 rounded-full shrink-0', match.categoryColor)} />
          <span className={cn('font-medium text-[#0f0e13] truncate', compact ? 'text-[11px]' : 'text-[12px]')}>
            {match.categoryName}
          </span>
        </div>
        <p className={cn('text-[#6b6a72] truncate', compact ? 'text-[10px]' : 'text-[11px]')}>
          {match.homeTeam} <span className="text-[#c4c2cc]">vs</span> {match.awayTeam}
        </p>

        {/* Staff status button below match info */}
        {staffInfo && compact && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect?.() }}
            className={cn(
              'mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors',
              staffInfo.total === 0
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : staffInfo.complete
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            )}
          >
            {staffInfo.total === 0 ? (
              <><UserPlus className="size-3" /> Asignar personal</>
            ) : (
              <><UserCheck className="size-3" /> {staffInfo.label}</>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        {detailHref && (
          <Link
            href={detailHref}
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 size-5 rounded flex items-center justify-center text-[#9b99a6] hover:text-[#ff3b2f] hover:bg-red-50 transition-all"
            title="Ver detalle del partido"
          >
            <Eye className="size-3" />
          </Link>
        )}
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="opacity-0 group-hover:opacity-100 size-5 rounded flex items-center justify-center text-[#9b99a6] hover:text-red-500 hover:bg-red-50 transition-all"
            title="Quitar del horario"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Day Column ──────────────────────────────────────────────────────────────

function DayColumn({
  label,
  day,
  tournamentId,
  scheduledMatches,
  dragOverSlot,
  draggedMatchId,
  selectedMatchId,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onRemove,
  onSelectMatch,
}: {
  label: string
  day: 'saturday' | 'sunday'
  tournamentId: string
  scheduledMatches: ScheduledMatch[]
  dragOverSlot: { day: 'saturday' | 'sunday'; timeSlot: string } | null
  draggedMatchId: string | null
  selectedMatchId: string | null
  onDragOver: (e: React.DragEvent, day: 'saturday' | 'sunday', timeSlot: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, day: 'saturday' | 'sunday', timeSlot: string) => void
  onDragStart: (match: ScheduledMatch) => void
  onRemove: (matchId: string) => void
  onSelectMatch: (matchId: string) => void
}) {
  const dayMatches = scheduledMatches.filter(m => m.day === day)
  const matchCount = dayMatches.length

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 border-b border-[#e8e6e1] bg-[#fafaf8]">
        <span className="text-[13px] font-bold text-[#1a365d] uppercase tracking-wide">{label}</span>
        <span className="text-[11px] text-[#9b99a6] font-medium">
          {matchCount} {matchCount === 1 ? 'partido' : 'partidos'}
        </span>
      </div>

      <div className="divide-y divide-[#f0eeeb]">
        {TIME_SLOTS.map(slot => {
          const matchInSlot = dayMatches.find(m => m.timeSlot === slot)
          const isOver = dragOverSlot?.day === day && dragOverSlot?.timeSlot === slot
          const isEmpty = !matchInSlot
          const isSwapTarget = isOver && !isEmpty && matchInSlot?.id !== draggedMatchId

          return (
            <div
              key={slot}
              onDragOver={(e) => onDragOver(e, day, slot)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, day, slot)}
              className={cn(
                'flex items-stretch min-h-[80px] transition-colors',
                isOver && isEmpty && 'bg-blue-50/80',
                isSwapTarget && 'bg-red-50/60',
              )}
            >
              <div className="w-[72px] shrink-0 flex flex-col items-center justify-center border-r border-[#f0eeeb] bg-[#fafaf8]">
                <span className="text-[12px] font-semibold text-[#1a365d]">{slot}</span>
                <span className="text-[9px] text-[#9b99a6]">1h 30m</span>
              </div>

              <div className="flex-1 px-3 py-2 flex items-center">
                {matchInSlot ? (
                  <div className="w-full">
                    <MatchCard
                      match={matchInSlot}
                      compact
                      onDragStart={() => onDragStart(matchInSlot)}
                      onRemove={() => onRemove(matchInSlot.id)}
                      onSelect={() => onSelectMatch(matchInSlot.id)}
                      isSelected={selectedMatchId === matchInSlot.id}
                      isDragTarget={isSwapTarget}
                      detailHref={`/admin/torneos/${tournamentId}/partidos/${matchInSlot.id}`}
                      staffInfo={{
                        label: staffLabel(matchInSlot.staff),
                        complete: hasMinimumStaff(matchInSlot.staff),
                        total: totalStaffCount(matchInSlot.staff),
                      }}
                    />
                  </div>
                ) : (
                  <div className={cn(
                    'size-full min-h-[40px] rounded-lg border-2 border-dashed flex items-center justify-center transition-colors',
                    isOver
                      ? 'border-blue-400 bg-blue-50 text-blue-500'
                      : 'border-[#e8e6e1] text-[#c4c2cc]'
                  )}>
                    <span className="text-[11px]">
                      {isOver ? 'Soltar acá' : 'Vacío'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
