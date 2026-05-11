'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CalendarIcon, Check, ChevronLeft, ChevronRight, HelpCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createTournamentAction } from '@/modules/admin/actions/tournamentActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { getModalitiesForSport } from '@/modules/admin/lib/modalities'

interface Sport { id: string; name: string; code: string }

interface NewTournamentContentProps {
  sports: Sport[]
}

const STEPS = [
  { id: 'info', title: 'Información', description: 'Nombre y disciplina' },
  { id: 'format', title: 'Formato', description: 'Modalidad y tipo de fixture' },
  { id: 'dates', title: 'Fechas del torneo', description: 'Cuándo arranca y termina' },
  { id: 'registration', title: 'Inscripciones', description: 'Ventana de inscripción' },
  { id: 'review', title: 'Confirmar', description: 'Revisá y creá el torneo' },
] as const

type StepId = (typeof STEPS)[number]['id']

function DatePickerField({
  label,
  value,
  onChange,
  minDate,
  placeholder = 'Seleccionar fecha',
  required = false,
}: {
  label: string
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  minDate?: Date
  placeholder?: string
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fromDate = minDate ?? today
  const toYear = today.getFullYear() + 3

  return (
    <div className="space-y-2">
      <Label>{label}{required && ' *'}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal cursor-pointer',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {value ? format(value, "PPP", { locale: es }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => { onChange(d); setOpen(false) }}
            disabled={{ before: fromDate }}
            defaultMonth={value ?? fromDate}
            startMonth={fromDate}
            endMonth={new Date(toYear, 11)}
            captionLayout="dropdown"
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function NewTournamentContent({ sports }: NewTournamentContentProps) {
  const router = useRouter()
  const [step, setStep] = useState<StepId>('info')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sportId, setSportId] = useState('')
  const [fixtureFormat, setFixtureFormat] = useState<'SINGLE_ROUND' | 'DOUBLE_ROUND'>('SINGLE_ROUND')
  const [modality, setModality] = useState('')

  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endMonth, setEndMonth] = useState('')  // "MM-YYYY" format
  const [endDate, setEndDate] = useState<Date | undefined>()

  const [regStartDate, setRegStartDate] = useState<Date | undefined>()
  const [regEndDate, setRegEndDate] = useState<Date | undefined>()

  const createAction = useServerAction(createTournamentAction, {
    successMessage: 'Torneo creado exitosamente',
    onSuccess: (data) => router.push(data?.id ? `/admin/torneos/${data.id}` : '/admin/torneos'),
  })

  const currentIndex = STEPS.findIndex((s) => s.id === step)

  // Build end month/year options starting from the start date's month (or current month)
  const endMonthOptions = useMemo(() => {
    const base = startDate ?? new Date()
    const options: { value: string; label: string }[] = []
    for (let i = 0; i < 24; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1)
      options.push({
        value: `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`,
        label: format(d, 'MMMM yyyy', { locale: es }),
      })
    }
    return options
  }, [startDate])

  // When endMonth changes, compute endDate as last day of that month
  const handleEndMonthChange = (val: string) => {
    setEndMonth(val)
    const [mm, yyyy] = val.split('-').map(Number)
    // Last day of the month
    const lastDay = new Date(yyyy, mm, 0)
    setEndDate(lastDay)
  }

  const canNextFromInfo = name.trim().length > 0 && sportId.length > 0
  const canNextFromDates = !!startDate && !!endMonth
  const canNext =
    step === 'info' ? canNextFromInfo :
    step === 'format' ? true :
    step === 'dates' ? canNextFromDates :
    true

  const goNext = () => {
    const next = STEPS[currentIndex + 1]
    if (next) setStep(next.id)
  }

  const goBack = () => {
    const prev = STEPS[currentIndex - 1]
    if (prev) setStep(prev.id)
  }

  const handleCreate = () => {
    createAction.execute({
      name: name.trim(),
      description: description.trim() || undefined,
      sportId,
      fixtureFormat,
      modality: modality.trim() || undefined,
      startDate: startDate!.toISOString(),
      endDate: endDate!.toISOString(),
      registrationStartDate: regStartDate?.toISOString(),
      registrationEndDate: regEndDate?.toISOString(),
    })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const selectedSport = sports.find((s) => s.id === sportId)
  const sportName = selectedSport?.name
  const modalityOptions = getModalitiesForSport(selectedSport?.code)

  return (
    <div>
      <PageHeader
        title="Nuevo torneo"
        description="Se creará en estado borrador"
        backHref="/admin/torneos"
      />

      {/* Steps indicator */}
      <nav className="mb-6">
        <ol className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const isActive = s.id === step
            const isDone = i < currentIndex

            return (
              <li key={s.id} className="flex items-center gap-2">
                {i > 0 && <div className={cn('h-px w-6', isDone ? 'bg-primary' : 'bg-border')} />}
                <button
                  type="button"
                  onClick={() => { if (isDone) setStep(s.id) }}
                  disabled={!isDone}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    isDone && 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20',
                    !isActive && !isDone && 'text-muted-foreground',
                  )}
                >
                  {isDone ? (
                    <Check className="size-3.5" />
                  ) : (
                    <span className="flex size-5 items-center justify-center rounded-full border text-xs">
                      {i + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{s.title}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="max-w-2xl">
        {/* Step 1: Info */}
        {step === 'info' && (
          <Card>
            <CardHeader>
              <CardTitle>Información general</CardTitle>
              <CardDescription>Datos básicos del torneo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Apertura 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción del torneo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Disciplina *</Label>
                <Select value={sportId} onValueChange={(v) => {
                  setSportId(v)
                  const nextSport = sports.find((s) => s.id === v)
                  const nextOptions = getModalitiesForSport(nextSport?.code)
                  if (modality && !nextOptions.includes(modality)) setModality('')
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>{sport.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Format */}
        {step === 'format' && (
          <Card>
            <CardHeader>
              <CardTitle>Formato del torneo</CardTitle>
              <CardDescription>Definí el tipo de fixture y la modalidad. Podés cambiarlo después.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <TooltipProvider delayDuration={200}>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label>Tipo de fixture *</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground cursor-help">
                          <HelpCircle className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-left">
                        <p className="mb-1"><strong>Una rueda:</strong> cada equipo enfrenta al otro una sola vez.</p>
                        <p><strong>Ida y vuelta:</strong> se enfrentan dos veces — como local y visitante.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={fixtureFormat} onValueChange={(v) => setFixtureFormat(v as 'SINGLE_ROUND' | 'DOUBLE_ROUND')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE_ROUND">Una rueda (todos contra todos)</SelectItem>
                      <SelectItem value="DOUBLE_ROUND">Ida y vuelta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="modality">Modalidad</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground cursor-help">
                          <HelpCircle className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-left">
                        <p>Cantidad de jugadores en cancha — ej. <strong>3v3</strong>, <strong>5v5</strong>, <strong>11</strong>. Se muestra como identificador del torneo.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={modality || undefined}
                    onValueChange={setModality}
                    disabled={modalityOptions.length === 0}
                  >
                    <SelectTrigger id="modality">
                      <SelectValue placeholder={
                        !selectedSport
                          ? 'Elegí una disciplina primero'
                          : modalityOptions.length === 0
                            ? 'Sin modalidades definidas'
                            : 'Seleccioná una modalidad'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {modalityOptions.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Tournament dates */}
        {step === 'dates' && (
          <Card>
            <CardHeader>
              <CardTitle>Fechas del torneo</CardTitle>
              <CardDescription>Definí cuándo empieza y termina el torneo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DatePickerField
                  label="Fecha de inicio"
                  value={startDate}
                  onChange={(d) => {
                    setStartDate(d)
                    if (d && endDate && endDate < d) {
                      setEndDate(undefined)
                      setEndMonth('')
                    }
                  }}
                  required
                />
                <div className="space-y-2">
                  <Label>Mes de fin *</Label>
                  <Select value={endMonth} onValueChange={handleEndMonthChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {endMonthOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label.charAt(0).toUpperCase() + opt.label.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Registration dates */}
        {step === 'registration' && (
          <Card>
            <CardHeader>
              <CardTitle>Ventana de inscripción</CardTitle>
              <CardDescription>
                Opcional — si no las definís ahora, podés configurarlas después desde la edición del torneo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DatePickerField
                  label="Apertura de inscripciones"
                  value={regStartDate}
                  onChange={(d) => {
                    setRegStartDate(d)
                    if (d && regEndDate && regEndDate < d) setRegEndDate(undefined)
                  }}
                  placeholder="Sin definir"
                />
                <DatePickerField
                  label="Cierre de inscripciones"
                  value={regEndDate}
                  onChange={setRegEndDate}
                  minDate={regStartDate ?? today}
                  placeholder="Sin definir"
                />
              </div>
              {regStartDate && regEndDate && startDate && regEndDate > startDate && (
                <p className="text-sm text-amber-600">
                  ⚠ El cierre de inscripciones ({format(regEndDate, 'dd/MM/yyyy')}) es posterior al inicio del torneo ({format(startDate, 'dd/MM/yyyy')}). ¿Es intencional?
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle>Revisá los datos</CardTitle>
              <CardDescription>
                El torneo se crea en estado <strong>Borrador</strong>. Después podés agregar categorías, zonas y precios antes de abrirlo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-sm text-muted-foreground">Nombre</dt>
                  <dd className="text-sm font-medium">{name}</dd>
                </div>
                {description && (
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-sm text-muted-foreground">Descripción</dt>
                    <dd className="text-sm max-w-xs text-right">{description}</dd>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-sm text-muted-foreground">Disciplina</dt>
                  <dd className="text-sm font-medium">{sportName}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-sm text-muted-foreground">Fixture</dt>
                  <dd className="text-sm font-medium">{fixtureFormat === 'DOUBLE_ROUND' ? 'Ida y vuelta' : 'Una rueda'}</dd>
                </div>
                {modality.trim() && (
                  <div className="flex justify-between border-b pb-2">
                    <dt className="text-sm text-muted-foreground">Modalidad</dt>
                    <dd className="text-sm font-medium">{modality.trim()}</dd>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-sm text-muted-foreground">Inicio</dt>
                  <dd className="text-sm font-medium">
                    {startDate ? format(startDate, "d 'de' MMMM, yyyy", { locale: es }) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-sm text-muted-foreground">Mes de fin</dt>
                  <dd className="text-sm font-medium">
                    {endDate ? (format(endDate, 'MMMM yyyy', { locale: es }).charAt(0).toUpperCase() + format(endDate, 'MMMM yyyy', { locale: es }).slice(1)) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-sm text-muted-foreground">Inscripciones</dt>
                  <dd className="text-sm">
                    {regStartDate && regEndDate
                      ? `${format(regStartDate, 'dd/MM/yyyy')} — ${format(regEndDate, 'dd/MM/yyyy')}`
                      : 'Sin definir'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {currentIndex > 0 && (
              <Button type="button" variant="outline" onClick={goBack}>
                <ChevronLeft className="mr-1 size-4" />
                Anterior
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => router.push('/admin/torneos')}>
              Cancelar
            </Button>
            {step !== 'review' ? (
              <Button type="button" onClick={goNext} disabled={!canNext}>
                Siguiente
                <ChevronRight className="ml-1 size-4" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={createAction.isPending}>
                {createAction.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Crear torneo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
