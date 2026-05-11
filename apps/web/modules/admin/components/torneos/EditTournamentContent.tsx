'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { MatchSchedulerContent } from '@/modules/admin/components/torneos/MatchSchedulerContent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertCircle, CalendarIcon, ChevronRight, HelpCircle, Loader2,
  Pencil, Plus, Trash2, Users, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import adminTournamentBrowserService from '@/modules/admin/services/AdminTournamentService'
import {
  updateTournamentAction, changeStatusAction,
  createCategoryAction, updateCategoryAction, deleteCategoryAction,
} from '@/modules/admin/actions/tournamentActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { AdminTournament, AdminCategory, TournamentStatus } from '@/modules/admin/types'
import { getModalitiesForSport } from '@/modules/admin/lib/modalities'

interface Sport { id: string; name: string; code: string }

interface EditTournamentContentProps {
  tournamentId: string
  initialData: { data: AdminTournament | null; error: string | null }
  sports: Sport[]
}

const STATUS_TRANSITIONS: Record<TournamentStatus, { status: TournamentStatus; label: string }[]> = {
  DRAFT: [{ status: 'OPEN', label: 'Abrir inscripciones' }],
  OPEN: [{ status: 'CLOSED', label: 'Cerrar inscripciones' }],
  CLOSED: [{ status: 'READY_TO_SHIP', label: 'Listo para arrancar' }],
  READY_TO_SHIP: [{ status: 'IN_PROGRESS', label: 'Iniciar torneo' }],
  IN_PROGRESS: [{ status: 'FINISHED', label: 'Finalizar torneo' }],
  FINISHED: [{ status: 'ARCHIVED', label: 'Archivar' }],
  ARCHIVED: [],
  CANCELLED: [],
}

const CANCELLABLE: TournamentStatus[] = ['DRAFT', 'OPEN', 'CLOSED', 'READY_TO_SHIP', 'IN_PROGRESS']

function parseDate(val: string | null | undefined): Date | undefined {
  if (!val) return undefined
  const d = new Date(val)
  return isNaN(d.getTime()) ? undefined : d
}

function DateField({ label, value, onChange, minDate }: {
  label: string; value: Date | undefined; onChange: (d: Date | undefined) => void; minDate?: Date
}) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fromDate = minDate ?? today

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-[#6b6a72]">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn('w-full justify-start text-left font-normal h-9 border-[#e8e6e1]', !value && 'text-[#9b99a6]')}>
            <CalendarIcon className="mr-2 size-3.5" />
            {value ? format(value, 'PPP', { locale: es }) : 'Sin definir'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit p-0" align="start">
          <Calendar
            mode="single" selected={value}
            onSelect={(d) => { onChange(d); setOpen(false) }}
            defaultMonth={value ?? fromDate}
            disabled={{ before: fromDate }}
            startMonth={fromDate}
            endMonth={new Date(today.getFullYear() + 3, 11)}
            captionLayout="dropdown" locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ── Tab trigger style (shared) ──
const tabTriggerClass = 'rounded-none border-b-2 border-transparent px-4 pb-2.5 pt-1 text-[13px] font-medium text-[#9b99a6] shadow-none data-[state=active]:border-[#ff3b2f] data-[state=active]:text-[#0f0e13] data-[state=active]:bg-transparent data-[state=active]:shadow-none'

// ═══════════════════════════════════════════════════════════════════════════
// Aranceles Tab
// ═══════════════════════════════════════════════════════════════════════════

interface PricingRow {
  id: string
  validFrom: string
  validTo: string
  cashAmount: string
  transferAmount: string
}

function ArancelesTab({ tournament }: { tournament: AdminTournament }) {
  const [insurancePerPlayer, setInsurancePerPlayer] = useState(tournament.insurancePerPlayer?.toString() ?? '')
  const [insuranceDuringTournament, setInsuranceDuringTournament] = useState('')
  const [latePaymentPenalty, setLatePaymentPenalty] = useState('')
  const [maxPlayersAfterStart, setMaxPlayersAfterStart] = useState('')

  const existingPricing = tournament.registrationPricing ?? []
  const [pricingRows, setPricingRows] = useState<PricingRow[]>(
    existingPricing.length > 0
      ? existingPricing.map((p) => ({
          id: p.id,
          validFrom: p.validFrom ? format(new Date(p.validFrom), 'yyyy-MM-dd') : '',
          validTo: p.validTo ? format(new Date(p.validTo), 'yyyy-MM-dd') : '',
          cashAmount: p.cashAmount?.toString() ?? '',
          transferAmount: p.transferAmount?.toString() ?? '',
        }))
      : [{ id: crypto.randomUUID(), validFrom: '', validTo: '', cashAmount: '', transferAmount: '' }]
  )

  const addPricingRow = () => {
    setPricingRows((prev) => [...prev, {
      id: crypto.randomUUID(),
      validFrom: '',
      validTo: '',
      cashAmount: '',
      transferAmount: '',
    }])
  }

  const removePricingRow = (id: string) => {
    setPricingRows((prev) => prev.filter((r) => r.id !== id))
  }

  const updatePricingRow = (id: string, field: keyof PricingRow, value: string) => {
    setPricingRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r))
  }

  // TODO: conectar con API — guardar aranceles del torneo
  const handleSave = () => {
    // Will call server action when backend is ready
  }

  return (
    <div className="space-y-8">
      {/* ── Aranceles de inscripción ── */}
      <section className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6]">Aranceles de inscripción</h3>
            <p className="text-[12px] text-[#c4c2cc] mt-1">Definí los precios por periodo. El precio sube después de cada fecha límite.</p>
          </div>
          <button
            type="button"
            onClick={addPricingRow}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#ff3b2f] hover:text-[#e5352a] transition-colors"
          >
            <Plus className="size-3.5" />
            Agregar periodo
          </button>
        </div>

        <div className="space-y-4">
          {pricingRows.map((row, idx) => (
            <div
              key={row.id}
              className={cn(
                'grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end',
                idx > 0 && 'pt-4 border-t border-[#f0efe9]'
              )}
            >
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b6a72]">Desde</Label>
                <Input
                  type="date"
                  value={row.validFrom}
                  onChange={(e) => updatePricingRow(row.id, 'validFrom', e.target.value)}
                  className="border-[#e8e6e1] h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b6a72]">Hasta</Label>
                <Input
                  type="date"
                  value={row.validTo}
                  onChange={(e) => updatePricingRow(row.id, 'validTo', e.target.value)}
                  className="border-[#e8e6e1] h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b6a72]">Efectivo ($)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={row.cashAmount}
                  onChange={(e) => updatePricingRow(row.id, 'cashAmount', e.target.value)}
                  className="border-[#e8e6e1] h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#6b6a72]">Transferencia ($)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={row.transferAmount}
                  onChange={(e) => updatePricingRow(row.id, 'transferAmount', e.target.value)}
                  className="border-[#e8e6e1] h-9"
                />
              </div>
              {pricingRows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePricingRow(row.id)}
                  className="size-9 inline-flex items-center justify-center rounded-md hover:bg-red-50 transition-colors self-end"
                >
                  <X className="size-3.5 text-[#c4c2cc] hover:text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Penalidades y seguros ── */}
      <section className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6] mb-5">Seguros y penalidades</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6b6a72]">Seguro por jugador ($)</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={insurancePerPlayer}
              onChange={(e) => setInsurancePerPlayer(e.target.value)}
              className="border-[#e8e6e1] h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6b6a72]">Seguro durante torneo ($)</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={insuranceDuringTournament}
              onChange={(e) => setInsuranceDuringTournament(e.target.value)}
              className="border-[#e8e6e1] h-9"
            />
            <p className="text-[11px] text-[#c4c2cc]">Costo del seguro una vez comenzado el torneo</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6b6a72]">Penalidad por pago fuera de término ($)</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={latePaymentPenalty}
              onChange={(e) => setLatePaymentPenalty(e.target.value)}
              className="border-[#e8e6e1] h-9"
            />
            <p className="text-[11px] text-[#c4c2cc]">Recargo cuando no se paga en fecha</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-[#6b6a72]">Máx. jugadores post-inicio</Label>
            <Input
              type="number"
              min={0}
              placeholder="Sin límite"
              value={maxPlayersAfterStart}
              onChange={(e) => setMaxPlayersAfterStart(e.target.value)}
              className="border-[#e8e6e1] h-9"
            />
            <p className="text-[11px] text-[#c4c2cc]">Máximo de jugadores a agregar después de iniciado el torneo</p>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-[#ff3b2f] hover:bg-[#e5352a] text-white"
        >
          Guardar aranceles
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function EditTournamentContent({ tournamentId, initialData, sports }: EditTournamentContentProps) {
  const qc = useQueryClient()
  const invalidate = useCallback(
    () => qc.refetchQueries({ queryKey: ['admin', 'tournament', tournamentId] }),
    [qc, tournamentId],
  )

  const { data: tournament, isPending, isError, refetch } = useQuery({
    queryKey: ['admin', 'tournament', tournamentId],
    queryFn: async () => {
      const response = await adminTournamentBrowserService.getTournamentById(tournamentId)
      return (response.data ?? response) as AdminTournament
    },
    initialData: !initialData.error && initialData.data ? initialData.data : undefined,
  })

  const initial = initialData.data
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    sportId: initial?.sportId ?? '',
    fixtureFormat: (initial?.fixtureFormat ?? 'SINGLE_ROUND') as 'SINGLE_ROUND' | 'DOUBLE_ROUND',
    modality: initial?.modality ?? '',
    startDate: parseDate(initial?.startDate),
    endDate: parseDate(initial?.endDate),
    registrationStartDate: parseDate(initial?.registrationStartDate),
    registrationEndDate: parseDate(initial?.registrationEndDate),
  })

  const isDirty = useMemo(() => {
    if (!initial) return false
    return (
      form.name !== (initial.name ?? '') ||
      form.description !== (initial.description ?? '') ||
      form.sportId !== (initial.sportId ?? '') ||
      form.fixtureFormat !== (initial.fixtureFormat ?? 'SINGLE_ROUND') ||
      form.modality !== (initial.modality ?? '') ||
      form.startDate?.toISOString() !== parseDate(initial.startDate)?.toISOString() ||
      form.endDate?.toISOString() !== parseDate(initial.endDate)?.toISOString() ||
      form.registrationStartDate?.toISOString() !== parseDate(initial.registrationStartDate)?.toISOString() ||
      form.registrationEndDate?.toISOString() !== parseDate(initial.registrationEndDate)?.toISOString()
    )
  }, [form, initial])

  const [catDialog, setCatDialog] = useState(false)
  const [catForm, setCatForm] = useState({ name: '' })
  const [editCat, setEditCat] = useState<AdminCategory | null>(null)
  const [editCatForm, setEditCatForm] = useState({ name: '' })
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null)

  const updateAction = useServerAction(updateTournamentAction, { successMessage: 'Torneo actualizado', onSuccess: invalidate })
  const changeStatusAct = useServerAction(changeStatusAction, { successMessage: 'Estado actualizado', onSuccess: invalidate })
  const createCatAct = useServerAction(createCategoryAction, {
    successMessage: 'Categoría creada',
    onSuccess: () => { invalidate(); setCatDialog(false); setCatForm({ name: '' }) },
  })
  const updateCatAct = useServerAction(updateCategoryAction, {
    successMessage: 'Categoría actualizada',
    onSuccess: () => { invalidate(); setEditCat(null) },
  })
  const deleteCatAct = useServerAction(deleteCategoryAction, {
    successMessage: 'Categoría eliminada',
    onSuccess: () => { invalidate(); setDeleteCatId(null) },
  })

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Torneo" backHref="/admin/torneos" />
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-[#6b6a72]">Error al cargar el torneo</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  if (isPending || !tournament) {
    return (
      <div>
        <PageHeader title="Torneo" backHref="/admin/torneos" />
        <div className="animate-pulse space-y-4"><div className="h-6 w-48 rounded bg-[#e8e6e1]" /><div className="h-64 rounded bg-[#e8e6e1]" /></div>
      </div>
    )
  }

  const handleSave = () => {
    updateAction.execute({
      id: tournamentId,
      name: form.name,
      description: form.description || undefined,
      sportId: form.sportId,
      fixtureFormat: form.fixtureFormat,
      modality: form.modality.trim() || null,
      startDate: form.startDate?.toISOString(),
      endDate: form.endDate?.toISOString(),
      registrationStartDate: form.registrationStartDate?.toISOString() || undefined,
      registrationEndDate: form.registrationEndDate?.toISOString() || undefined,
    })
  }

  const openEditCat = (cat: AdminCategory) => {
    setEditCat(cat)
    setEditCatForm({ name: cat.name })
  }

  const transitions = STATUS_TRANSITIONS[tournament.status] ?? []
  const canCancel = CANCELLABLE.includes(tournament.status)
  const categories = tournament.categories ?? []

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6">
        <PageHeader
          title={tournament.name}
          backHref="/admin/torneos"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {transitions.map((tr, idx) => (
                <Button
                  key={tr.status}
                  size="sm"
                  variant={idx === 0 ? 'default' : 'outline'}
                  className={
                    idx === 0
                      ? 'bg-[#ff3b2f] hover:bg-[#e5352a] text-white'
                      : 'border-[#e8e6e1]'
                  }
                  disabled={changeStatusAct.isPending}
                  onClick={() => changeStatusAct.execute({ id: tournamentId, status: tr.status })}
                >
                  {tr.label}
                </Button>
              ))}
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  disabled={changeStatusAct.isPending}
                  onClick={() => changeStatusAct.execute({ id: tournamentId, status: 'CANCELLED' })}
                >
                  Cancelar torneo
                </Button>
              )}
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <StatusBadge status={tournament.status} type="tournament" />
          {tournament.modality && (
            <span className="inline-flex items-center rounded-md bg-[#0f0e13] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              {tournament.modality}
            </span>
          )}
          <span className="inline-flex items-center rounded-md border border-[#e8e6e1] px-2 py-0.5 text-[11px] font-medium text-[#6b6a72]">
            {tournament.fixtureFormat === 'DOUBLE_ROUND' ? 'Ida y vuelta' : 'Una rueda'}
          </span>
          <span className="text-[13px] text-[#9b99a6]">
            · {categories.length} categorías · {tournament._count?.registrations ?? 0} inscripciones
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="info">
        <TabsList className="bg-transparent p-0 h-auto border-b border-[#f0efe9] rounded-none w-full justify-start gap-0">
          <TabsTrigger value="info" className={tabTriggerClass}>Información general</TabsTrigger>
          <TabsTrigger value="calendario" className={tabTriggerClass}>Calendario</TabsTrigger>
          <TabsTrigger value="aranceles" className={tabTriggerClass}>Aranceles</TabsTrigger>
        </TabsList>

        {/* ═══ Tab: Información general ═══ */}
        <TabsContent value="info" className="mt-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            {/* Left: Info + Dates */}
            <div className="space-y-8">
              <section className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6]">Datos del torneo</h3>
                  <Button
                    disabled={!isDirty || updateAction.isPending}
                    onClick={handleSave}
                    size="sm"
                    className="bg-[#ff3b2f] hover:bg-[#e5352a] text-white"
                  >
                    {updateAction.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Guardar cambios
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#6b6a72]">Nombre</Label>
                    <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className="border-[#e8e6e1] h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#6b6a72]">Descripción</Label>
                    <Textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="border-[#e8e6e1] resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#6b6a72]">Disciplina</Label>
                    <Select value={form.sportId} onValueChange={(v) => {
                      const nextSport = sports.find((s) => s.id === v)
                      const nextOptions = getModalitiesForSport(nextSport?.code)
                      setForm((p) => ({
                        ...p,
                        sportId: v,
                        modality: p.modality && nextOptions.includes(p.modality) ? p.modality : '',
                      }))
                    }}>
                      <SelectTrigger className="border-[#e8e6e1] h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{sports.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-[#f0efe9] my-6" />

                <TooltipProvider delayDuration={200}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6] mb-5">Formato</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-[#6b6a72]">Tipo de fixture</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-[#c4c2cc] hover:text-[#6b6a72] cursor-help">
                              <HelpCircle className="size-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-left">
                            <p className="mb-1"><strong>Una rueda:</strong> cada equipo enfrenta al otro una sola vez.</p>
                            <p><strong>Ida y vuelta:</strong> se enfrentan dos veces — como local y visitante.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        value={form.fixtureFormat}
                        onValueChange={(v) => setForm(prev => ({ ...prev, fixtureFormat: v as 'SINGLE_ROUND' | 'DOUBLE_ROUND' }))}
                      >
                        <SelectTrigger className="border-[#e8e6e1] h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE_ROUND">Una rueda</SelectItem>
                          <SelectItem value="DOUBLE_ROUND">Ida y vuelta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-[#6b6a72]">Modalidad</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-[#c4c2cc] hover:text-[#6b6a72] cursor-help">
                              <HelpCircle className="size-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-left">
                            <p>Cantidad de jugadores en cancha — ej. <strong>3v3</strong>, <strong>5v5</strong>, <strong>11</strong>.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {(() => {
                        const currentSport = sports.find((s) => s.id === form.sportId)
                        const opts = getModalitiesForSport(currentSport?.code)
                        return (
                          <Select
                            value={form.modality || undefined}
                            onValueChange={(v) => setForm(prev => ({ ...prev, modality: v }))}
                            disabled={opts.length === 0}
                          >
                            <SelectTrigger className="border-[#e8e6e1] h-9">
                              <SelectValue placeholder={
                                !currentSport
                                  ? 'Elegí disciplina primero'
                                  : opts.length === 0
                                    ? 'Sin modalidades definidas'
                                    : 'Seleccioná una modalidad'
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {opts.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )
                      })()}
                    </div>
                  </div>
                </TooltipProvider>

                <div className="border-t border-[#f0efe9] my-6" />

                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6] mb-5">Fechas del torneo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DateField label="Inicio" value={form.startDate} onChange={(d) => {
                    setForm((p) => ({ ...p, startDate: d, endDate: d && p.endDate && p.endDate < d ? undefined : p.endDate }))
                  }} />
                  <DateField label="Fin" value={form.endDate} onChange={(d) => setForm(prev => ({ ...prev, endDate: d }))} minDate={form.startDate} />
                </div>

                <div className="border-t border-[#f0efe9] my-6" />

                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6] mb-5">Inscripciones</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DateField label="Apertura" value={form.registrationStartDate} onChange={(d) => {
                    setForm((p) => ({ ...p, registrationStartDate: d, registrationEndDate: d && p.registrationEndDate && p.registrationEndDate < d ? undefined : p.registrationEndDate }))
                  }} />
                  <DateField label="Cierre" value={form.registrationEndDate} onChange={(d) => setForm(prev => ({ ...prev, registrationEndDate: d }))} minDate={form.registrationStartDate} />
                </div>
              </section>
            </div>

            {/* Right: Categories */}
            <section className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden self-start">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0efe9]">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6]">Categorías</h3>
                <button
                  type="button"
                  onClick={() => setCatDialog(true)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#ff3b2f] hover:text-[#e5352a] transition-colors"
                >
                  <Plus className="size-3.5" />
                  Nueva
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-[13px] text-[#9b99a6]">No hay categorías todavía</p>
                  <p className="text-[12px] text-[#c4c2cc] mt-1">Creá la primera para organizar el torneo</p>
                </div>
              ) : (
                <div>
                  {categories.map((cat, idx) => {
                    const teamCount = cat.zones.reduce((a, z) => a + z.teams.length, 0)
                    return (
                      <div
                        key={cat.id}
                        className={cn(
                          'group flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-[#fafaf8]',
                          idx < categories.length - 1 && 'border-b border-[#f0efe9]'
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/torneos/${tournamentId}/categorias/${cat.id}`}
                            className="text-[14px] font-medium text-[#0f0e13] hover:text-[#ff3b2f] transition-colors"
                          >
                            {cat.name}
                          </Link>
                          <div className="flex items-center gap-3 mt-0.5 text-[12px] text-[#9b99a6]">
                            <span>{cat.zones.length} zonas</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-3" />{teamCount} equipos
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => openEditCat(cat)}
                            className="size-7 inline-flex items-center justify-center rounded-md hover:bg-[#f0efe9] transition-colors"
                          >
                            <Pencil className="size-3.5 text-[#6b6a72]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCatId(cat.id)}
                            className="size-7 inline-flex items-center justify-center rounded-md hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="size-3.5 text-[#c4c2cc] hover:text-destructive" />
                          </button>
                        </div>
                        <Link
                          href={`/admin/torneos/${tournamentId}/categorias/${cat.id}`}
                          className="shrink-0 text-[#c4c2cc] group-hover:text-[#9b99a6] transition-colors"
                        >
                          <ChevronRight className="size-4" />
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </TabsContent>

        {/* ═══ Tab: Calendario ═══ */}
        <TabsContent value="calendario" className="mt-6">
          <MatchSchedulerContent tournamentId={tournamentId} embedded />
        </TabsContent>

        {/* ═══ Tab: Aranceles ═══ */}
        <TabsContent value="aranceles" className="mt-6">
          <ArancelesTab tournament={tournament} />
        </TabsContent>
      </Tabs>

      {/* ══════════ DIALOGS ══════════ */}

      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva categoría</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b6a72]">Nombre *</Label>
              <Input placeholder="Ej: Primera División, Sub-20" value={catForm.name} onChange={(e) => setCatForm({ name: e.target.value })} className="border-[#e8e6e1] h-9" />
              <p className="text-[11px] text-[#c4c2cc]">Las zonas y la asignación de equipos se configuran después, al entrar al detalle de la categoría.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)} className="border-[#e8e6e1]">Cancelar</Button>
            <Button
              disabled={createCatAct.isPending || !catForm.name}
              onClick={() => createCatAct.execute({ tournamentId, name: catForm.name })}
              className="bg-[#ff3b2f] hover:bg-[#e5352a] text-white"
            >
              {createCatAct.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editCat} onOpenChange={(open) => !open && setEditCat(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar categoría</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#6b6a72]">Nombre *</Label>
              <Input value={editCatForm.name} onChange={(e) => setEditCatForm({ name: e.target.value })} className="border-[#e8e6e1] h-9" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCat(null)} className="border-[#e8e6e1]">Cancelar</Button>
            <Button
              disabled={updateCatAct.isPending || !editCatForm.name}
              onClick={() => editCat && updateCatAct.execute({ tournamentId, categoryId: editCat.id, name: editCatForm.name })}
              className="bg-[#ff3b2f] hover:bg-[#e5352a] text-white"
            >
              {updateCatAct.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteCatId}
        onOpenChange={(open) => !open && setDeleteCatId(null)}
        title="Eliminar categoría"
        description="Se eliminarán todas las zonas y asignaciones de equipos de esta categoría."
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={() => deleteCatId && deleteCatAct.execute({ tournamentId, categoryId: deleteCatId })}
        loading={deleteCatAct.isPending}
      />
    </div>
  )
}
