'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertCircle, CalendarIcon, FolderOpen, Loader2, ListChecks, Swords } from 'lucide-react'
import { cn } from '@/lib/utils'
import adminTournamentBrowserService from '@/modules/admin/services/AdminTournamentService'
import { updateTournamentAction, changeStatusAction } from '@/modules/admin/actions/tournamentActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { AdminTournament, TournamentStatus } from '@/modules/admin/types'

interface Sport { id: string; name: string; code: string }

interface EditTournamentContentProps {
  tournamentId: string
  initialData: { data: AdminTournament | null; error: string | null }
  sports: Sport[]
}

const STATUS_TRANSITIONS: Record<TournamentStatus, { status: TournamentStatus; label: string }[]> = {
  DRAFT: [{ status: 'OPEN', label: 'Abrir inscripciones' }],
  OPEN: [{ status: 'CLOSED', label: 'Cerrar inscripciones' }],
  CLOSED: [{ status: 'READY_TO_SHIP', label: 'Marcar listo para arrancar' }],
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

function DateField({
  label,
  value,
  onChange,
  minDate,
}: {
  label: string
  value: Date | undefined
  onChange: (d: Date | undefined) => void
  minDate?: Date
}) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fromDate = minDate ?? today

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal cursor-pointer',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, 'PPP', { locale: es }) : 'Sin definir'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => { onChange(d); setOpen(false) }}
            defaultMonth={value ?? fromDate}
            disabled={{ before: fromDate }}
            startMonth={fromDate}
            endMonth={new Date(today.getFullYear() + 3, 11)}
            captionLayout="dropdown"
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function EditTournamentContent({ tournamentId, initialData, sports }: EditTournamentContentProps) {
  const qc = useQueryClient()
  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['admin', 'tournament', tournamentId] }), [qc, tournamentId])

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
      form.startDate?.toISOString() !== parseDate(initial.startDate)?.toISOString() ||
      form.endDate?.toISOString() !== parseDate(initial.endDate)?.toISOString() ||
      form.registrationStartDate?.toISOString() !== parseDate(initial.registrationStartDate)?.toISOString() ||
      form.registrationEndDate?.toISOString() !== parseDate(initial.registrationEndDate)?.toISOString()
    )
  }, [form, initial])

  const updateAction = useServerAction(updateTournamentAction, { successMessage: 'Torneo actualizado', onSuccess: invalidate })
  const changeStatusAct = useServerAction(changeStatusAction, { successMessage: 'Estado actualizado', onSuccess: invalidate })

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Torneo" description="Edita el torneo" backHref="/admin/torneos" />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar el torneo</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  if (isPending || !tournament) {
    return (
      <div>
        <PageHeader title="Torneo" description="Cargando..." backHref="/admin/torneos" />
        <div className="animate-pulse space-y-4"><div className="h-6 w-48 rounded bg-muted" /><div className="h-64 rounded bg-muted" /></div>
      </div>
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateAction.execute({
      id: tournamentId,
      name: form.name,
      description: form.description || undefined,
      sportId: form.sportId,
      startDate: form.startDate?.toISOString(),
      endDate: form.endDate?.toISOString(),
      registrationStartDate: form.registrationStartDate?.toISOString() || undefined,
      registrationEndDate: form.registrationEndDate?.toISOString() || undefined,
    })
  }

  const transitions = STATUS_TRANSITIONS[tournament.status] ?? []
  const canCancel = CANCELLABLE.includes(tournament.status)

  return (
    <div>
      <PageHeader
        title={tournament.name}
        description="Edita la información del torneo"
        backHref="/admin/torneos"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              disabled={!isDirty || updateAction.isPending}
              onClick={handleSave}
            >
              {updateAction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
            {transitions.map((tr) => (
              <Button key={tr.status} variant="outline" onClick={() => changeStatusAct.execute({ id: tournamentId, status: tr.status })}>
                {tr.label}
              </Button>
            ))}
            {canCancel && (
              <Button variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => changeStatusAct.execute({ id: tournamentId, status: 'CANCELLED' })}>
                Cancelar torneo
              </Button>
            )}
          </div>
        }
      />

      {/* Status + stats + quick links */}
      <div className="mb-6 flex items-center gap-3">
        <StatusBadge status={tournament.status} type="tournament" />
        <span className="text-sm text-muted-foreground">
          {tournament._count?.categories ?? 0} categorías · {tournament._count?.registrations ?? 0} inscripciones
        </span>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/torneos/${tournamentId}/categorias`}>
              <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
              Categorías
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/torneos/${tournamentId}/inscripciones`}>
              <ListChecks className="mr-1.5 h-3.5 w-3.5" />
              Inscripciones
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/torneos/${tournamentId}/partidos`}>
              <Swords className="mr-1.5 h-3.5 w-3.5" />
              Partidos
            </Link>
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Información general</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select value={form.sportId} onValueChange={(v) => setForm({ ...form, sportId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{sports.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fechas del torneo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <DateField
                label="Fecha de inicio"
                value={form.startDate}
                onChange={(d) => {
                  setForm((prev) => ({
                    ...prev,
                    startDate: d,
                    endDate: d && prev.endDate && prev.endDate < d ? undefined : prev.endDate,
                  }))
                }}
              />
              <DateField
                label="Fecha de fin"
                value={form.endDate}
                onChange={(d) => setForm({ ...form, endDate: d })}
                minDate={form.startDate}
              />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <DateField
                label="Apertura de inscripciones"
                value={form.registrationStartDate}
                onChange={(d) => {
                  setForm((prev) => ({
                    ...prev,
                    registrationStartDate: d,
                    registrationEndDate: d && prev.registrationEndDate && prev.registrationEndDate < d ? undefined : prev.registrationEndDate,
                  }))
                }}
              />
              <DateField
                label="Cierre de inscripciones"
                value={form.registrationEndDate}
                onChange={(d) => setForm({ ...form, registrationEndDate: d })}
                minDate={form.registrationStartDate}
              />
            </div>
          </CardContent>
        </Card>

        {(tournament.registrationPricing ?? []).length > 0 && (
          <Card>
            <CardHeader><CardTitle>Precios de inscripción</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tournament.registrationPricing.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">${p.entryFeeAmount.toLocaleString('es-AR')} {p.currency}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(p.validFrom).toLocaleDateString('es-AR')} - {new Date(p.validTo).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}
