'use client'

import { useState, useCallback, useTransition, useEffect } from 'react'
import {
  format,
  addMonths, subMonths,
  addWeeks, subWeeks,
  addDays, subDays,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  isSameDay, isSameMonth, isToday,
  parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Plus, MapPin, Clock, CalendarDays,
  X, GripVertical, Trophy, Tag, ChevronDown, Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { rescheduleMatchAction } from '@/modules/admin/actions/matchActions'

// ─── Types ────────────────────────────────────────────────────────────────────

type MatchStatus =
  | 'programado'
  | 'en_curso'
  | 'suspendido'
  | 'cancelado'
  | 'reprogramado'
  | 'finalizado'

type CalendarView = 'month' | 'week' | 'day'

export interface AdminMatch {
  id: string
  homeTeamName: string
  awayTeamName: string
  matchDate: string      // YYYY-MM-DD
  matchTime?: string     // HH:mm
  venueName?: string
  status: MatchStatus
  categoryName?: string
  tournamentName?: string
  staffNames?: string[]  // referees, officials, etc.
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7) // 07–22

const STATUS_CHIP: Record<MatchStatus, string> = {
  programado:   'border-l-blue-400   bg-blue-50   text-blue-800',
  en_curso:     'border-l-amber-400  bg-amber-50  text-amber-800',
  finalizado:   'border-l-emerald-400 bg-emerald-50 text-emerald-800',
  suspendido:   'border-l-orange-400 bg-orange-50 text-orange-800',
  cancelado:    'border-l-red-400    bg-red-50    text-red-800',
  reprogramado: 'border-l-purple-400 bg-purple-50 text-purple-800',
}

const STATUS_DOT: Record<MatchStatus, string> = {
  programado:   'bg-blue-400',
  en_curso:     'bg-amber-400',
  finalizado:   'bg-emerald-400',
  suspendido:   'bg-orange-400',
  cancelado:    'bg-red-400',
  reprogramado: 'bg-purple-400',
}

const STATUS_LABEL: Record<MatchStatus, string> = {
  programado:   'Programado',
  en_curso:     'En curso',
  finalizado:   'Finalizado',
  suspendido:   'Suspendido',
  cancelado:    'Cancelado',
  reprogramado: 'Reprogramado',
}

const STATUS_BADGE: Record<MatchStatus, string> = {
  programado:   'bg-blue-100 text-blue-700',
  en_curso:     'bg-amber-100 text-amber-700',
  finalizado:   'bg-emerald-100 text-emerald-700',
  suspendido:   'bg-orange-100 text-orange-700',
  cancelado:    'bg-red-100 text-red-700',
  reprogramado: 'bg-purple-100 text-purple-700',
}

// ─── Match Detail Drawer ──────────────────────────────────────────────────────

function MatchDetailDrawer({
  match,
  onClose,
}: {
  match: AdminMatch | null
  onClose: () => void
}) {
  const open = match !== null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const dateStr = match
    ? format(parseISO(match.matchDate + 'T00:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })
    : ''

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition-all duration-300',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/25 backdrop-blur-[1px] transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'absolute top-0 right-0 h-full w-80 bg-white shadow-2xl shadow-black/20 flex flex-col transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#f0eeeb] shrink-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold',
              match ? STATUS_BADGE[match.status] : '',
            )}>
              {match && <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[match.status])} />}
              {match ? STATUS_LABEL[match.status] : ''}
            </span>
            <button
              onClick={onClose}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[#f0eeeb] text-[#9b99a6] hover:text-[#0f0e13] transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {match && (
            <div>
              <p className="text-[15px] font-bold text-[#0f0e13] leading-snug font-din-display">
                {match.homeTeamName}
              </p>
              <p className="text-[11px] text-[#9b99a6] font-medium my-1 uppercase tracking-wider">vs</p>
              <p className="text-[15px] font-bold text-[#0f0e13] leading-snug font-din-display">
                {match.awayTeamName}
              </p>
            </div>
          )}
        </div>

        {/* Details */}
        {match && (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <Row icon={<CalendarDays className="h-3.5 w-3.5" />} label="Fecha">
              <span className="capitalize">{dateStr}</span>
              {match.matchTime && (
                <span className="ml-1.5 text-[#9b99a6]">· {match.matchTime} hs</span>
              )}
            </Row>

            {match.venueName && (
              <Row icon={<MapPin className="h-3.5 w-3.5" />} label="Sede">
                {match.venueName}
              </Row>
            )}

            {match.tournamentName && (
              <Row icon={<Trophy className="h-3.5 w-3.5" />} label="Torneo">
                {match.tournamentName}
              </Row>
            )}

            {match.categoryName && (
              <Row icon={<Tag className="h-3.5 w-3.5" />} label="Categoría">
                {match.categoryName}
              </Row>
            )}

            {match.staffNames && match.staffNames.length > 0 && (
              <Row icon={<Clock className="h-3.5 w-3.5" />} label="Personal">
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {match.staffNames.map(name => (
                    <span
                      key={name}
                      className="rounded-full bg-[#f0eeeb] px-2 py-0.5 text-[10px] font-medium text-[#6b6a72]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </Row>
            )}
          </div>
        )}

        {/* Footer */}
        {match && (
          <div className="px-5 py-4 border-t border-[#f0eeeb] shrink-0">
            <Link
              href={`/admin/partidos/${match.id}`}
              className="flex items-center justify-center gap-2 w-full h-9 rounded-lg bg-[#ff3b2f] hover:bg-[#e0342a] active:bg-[#c42e25] text-white text-[13px] font-semibold transition-colors shadow-sm shadow-[#ff3b2f]/20"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar partido
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({
  icon, label, children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-[#9b99a6]">{icon}</span>
      <div className="min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b0aebe] block mb-0.5">
          {label}
        </span>
        <span className="text-[13px] text-[#3d3c44]">{children}</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface MatchCalendarProps {
  initialMatches: AdminMatch[]
}

export function MatchCalendar({ initialMatches }: MatchCalendarProps) {
  const [view, setView]               = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [matches, setMatches]         = useState<AdminMatch[]>(initialMatches)
  const [draggedId, setDraggedId]     = useState<string | null>(null)
  const [dropTarget, setDropTarget]   = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<AdminMatch | null>(null)
  const [dragEnabled, setDragEnabled] = useState(false)
  const [, startTransition]           = useTransition()

  // ── Navigation ────────────────────────────────────────────────────────────

  const goNext = () =>
    setCurrentDate(d =>
      view === 'month' ? addMonths(d, 1) :
      view === 'week'  ? addWeeks(d, 1) :
                         addDays(d, 1)
    )

  const goPrev = () =>
    setCurrentDate(d =>
      view === 'month' ? subMonths(d, 1) :
      view === 'week'  ? subWeeks(d, 1) :
                         subDays(d, 1)
    )

  const navigateToDay = useCallback((day: Date) => {
    setCurrentDate(day)
    setView('day')
  }, [])

  const titleLabel = () => {
    if (view === 'month')
      return format(currentDate, 'MMMM yyyy', { locale: es })
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
      const we = endOfWeek(currentDate,   { weekStartsOn: 1 })
      return `${format(ws, "d 'de' MMM", { locale: es })} – ${format(we, "d 'de' MMM yyyy", { locale: es })}`
    }
    return format(currentDate, "EEEE d 'de' MMMM yyyy", { locale: es })
  }

  // ── Date picker ───────────────────────────────────────────────────────────

  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i)

  const setDay = (day: number) => {
    const d = new Date(currentDate)
    d.setDate(day)
    setCurrentDate(d)
  }
  const setMonth = (month: number) => {
    const d = new Date(currentDate)
    d.setMonth(month)
    setCurrentDate(d)
  }
  const setYear = (year: number) => {
    const d = new Date(currentDate)
    d.setFullYear(year)
    setCurrentDate(d)
  }

  // ── DnD (day view only) ───────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, matchId: string) => {
    e.dataTransfer.setData('matchId', matchId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedId(matchId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDropTarget(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, cellKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(cellKey)
  }, [])

  const handleDragLeave = useCallback(() => setDropTarget(null), [])

  const handleDrop = useCallback((e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    const matchId = e.dataTransfer.getData('matchId') || draggedId
    setDraggedId(null)
    setDropTarget(null)
    if (!matchId) return

    const newDateStr = format(targetDate, 'yyyy-MM-dd')
    const prev = matches.find(m => m.id === matchId)
    if (!prev || prev.matchDate === newDateStr) return

    setMatches(ms => ms.map(m => m.id === matchId ? { ...m, matchDate: newDateStr } : m))

    startTransition(async () => {
      const result = await rescheduleMatchAction(matchId, newDateStr)
      if (!result.success) {
        toast.error(result.error ?? 'No se pudo reprogramar el partido')
        setMatches(ms => ms.map(m => m.id === matchId ? { ...m, matchDate: prev.matchDate } : m))
      } else {
        toast.success('Partido reprogramado')
      }
    })
  }, [draggedId, matches, startTransition])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const matchesForDay = useCallback(
    (day: Date) => matches.filter(m => isSameDay(new Date(m.matchDate + 'T00:00:00'), day)),
    [matches],
  )

  const handleMatchClick = useCallback((match: AdminMatch) => {
    setSelectedMatch(match)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-[#f7f6f4] overflow-hidden">

      {/* ── Match Detail Drawer ── */}
      <MatchDetailDrawer
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />

      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-[#e8e6e1] shrink-0">

        {/* Row 1: nav arrows + title | view switcher + new match */}
        <div className="flex items-center justify-between px-3 sm:px-5 h-12 gap-2">

          {/* Left: nav */}
          <div className="flex items-center gap-1 min-w-0">
            <button
              onClick={goPrev}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#f0eeeb] text-[#6b6a72] hover:text-[#0f0e13] transition-colors shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="h-8 px-2.5 text-xs font-medium rounded-lg border border-[#e8e6e1] hover:bg-[#f0eeeb] text-[#6b6a72] hover:text-[#0f0e13] transition-colors shrink-0"
            >
              Hoy
            </button>
            <button
              onClick={goNext}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#f0eeeb] text-[#6b6a72] hover:text-[#0f0e13] transition-colors shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <h2 className="ml-2 text-[13px] sm:text-[15px] font-semibold text-[#0f0e13] capitalize truncate select-none">
              {titleLabel()}
            </h2>
          </div>

          {/* Right: view switcher + new match */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex rounded-lg border border-[#e8e6e1] overflow-hidden text-[11px] sm:text-[12px] font-medium">
              {(['month', 'week', 'day'] as CalendarView[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'px-2.5 sm:px-3.5 h-8 transition-all duration-150',
                    view === v
                      ? 'bg-[#ff3b2f] text-white'
                      : 'bg-white text-[#6b6a72] hover:bg-[#f0eeeb] hover:text-[#0f0e13]',
                  )}
                >
                  {v === 'month' ? 'Mes' : v === 'week' ? <><span className="sm:hidden">Sem</span><span className="hidden sm:inline">Semana</span></> : 'Día'}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3.5 bg-[#ff3b2f] hover:bg-[#e0342a] active:bg-[#c42e25] text-white text-[11px] sm:text-[12px] font-semibold rounded-lg transition-colors shadow-sm shadow-[#ff3b2f]/20 shrink-0">
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Nuevo partido</span>
            </button>
          </div>
        </div>

        {/* Row 2: date pickers | drag toggle (day only) */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 border-t border-[#f0eeeb] gap-3">

          {/* Date pickers */}
          <div className="flex items-center gap-1">
            <div className="relative">
              <select
                value={currentDate.getDate()}
                onChange={e => setDay(Number(e.target.value))}
                className="h-7 appearance-none rounded-md border border-[#e8e6e1] bg-white pl-2 pr-5 text-[11px] font-medium text-[#3d3c44] hover:border-[#d0ceca] focus:outline-none focus:ring-2 focus:ring-[#ff3b2f]/30 cursor-pointer"
              >
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-[#9b99a6]" />
            </div>

            <div className="relative">
              <select
                value={currentDate.getMonth()}
                onChange={e => setMonth(Number(e.target.value))}
                className="h-7 appearance-none rounded-md border border-[#e8e6e1] bg-white pl-2 pr-5 text-[11px] font-medium text-[#3d3c44] hover:border-[#d0ceca] focus:outline-none focus:ring-2 focus:ring-[#ff3b2f]/30 cursor-pointer"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-[#9b99a6]" />
            </div>

            <div className="relative">
              <select
                value={currentDate.getFullYear()}
                onChange={e => setYear(Number(e.target.value))}
                className="h-7 appearance-none rounded-md border border-[#e8e6e1] bg-white pl-2 pr-5 text-[11px] font-medium text-[#3d3c44] hover:border-[#d0ceca] focus:outline-none focus:ring-2 focus:ring-[#ff3b2f]/30 cursor-pointer"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-[#9b99a6]" />
            </div>
          </div>

          {/* Drag toggle (day view only) */}
          {view === 'day' && (
            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
              <span className="text-[11px] text-[#9b99a6] items-center gap-1 hidden sm:flex">
                <GripVertical className="h-3.5 w-3.5 shrink-0" />
                Modificar horarios
              </span>
              <GripVertical className="h-3.5 w-3.5 text-[#9b99a6] sm:hidden" />
              <button
                role="switch"
                aria-checked={dragEnabled}
                onClick={() => setDragEnabled(v => !v)}
                className={cn(
                  'relative h-5 w-9 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b2f]/50 shrink-0',
                  dragEnabled ? 'bg-[#ff3b2f]' : 'bg-[#d9d7e0]',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                    dragEnabled ? 'translate-x-4' : 'translate-x-0',
                  )}
                />
              </button>
            </label>
          )}
        </div>
      </div>

      {/* ── Calendar Content ── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            matchesForDay={matchesForDay}
            draggedId={null}
            dropTarget={null}
            onDragStart={() => {}}
            onDragEnd={() => {}}
            onDragOver={() => {}}
            onDragLeave={() => {}}
            onDrop={() => {}}
            onDayClick={navigateToDay}
            onMatchClick={handleMatchClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            matchesForDay={matchesForDay}
            draggedId={null}
            dropTarget={null}
            onDragStart={() => {}}
            onDragEnd={() => {}}
            onDragOver={() => {}}
            onDragLeave={() => {}}
            onDrop={() => {}}
            onDayClick={navigateToDay}
            onMatchClick={handleMatchClick}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            matchesForDay={matchesForDay}
            draggedId={dragEnabled ? draggedId : null}
            dropTarget={dragEnabled ? dropTarget : null}
            onDragStart={dragEnabled ? handleDragStart : () => {}}
            onDragEnd={dragEnabled ? handleDragEnd : () => {}}
            onDragOver={dragEnabled ? handleDragOver : () => {}}
            onDragLeave={dragEnabled ? handleDragLeave : () => {}}
            onDrop={dragEnabled ? handleDrop : () => {}}
            onMatchClick={!dragEnabled ? handleMatchClick : undefined}
            dragEnabled={dragEnabled}
          />
        )}
      </div>
    </div>
  )
}

// ─── Shared view props ────────────────────────────────────────────────────────

interface ViewProps {
  currentDate: Date
  matchesForDay: (day: Date) => AdminMatch[]
  draggedId: string | null
  dropTarget: string | null
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, cellKey: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, date: Date) => void
  onDayClick?: (day: Date) => void
  onMatchClick?: (match: AdminMatch) => void
  dragEnabled?: boolean
}

// ─── Match Chip (compact — month/week, click = detail, no drag) ───────────────

function MatchChip({
  match, onMatchClick,
}: {
  match: AdminMatch
  onMatchClick: (match: AdminMatch) => void
}) {
  return (
    <button
      onClick={() => onMatchClick(match)}
      title={`${match.homeTeamName} vs ${match.awayTeamName}`}
      className={cn(
        'w-full rounded px-1.5 py-[2px] text-[10px] leading-snug font-medium',
        'border-l-[3px] select-none',
        'flex items-center gap-1 min-w-0 transition-all truncate',
        'hover:brightness-95 hover:shadow-sm cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#ff3b2f]/50',
        STATUS_CHIP[match.status],
      )}
    >
      {match.matchTime && (
        <span className="opacity-50 shrink-0 font-normal text-[9px]">{match.matchTime}</span>
      )}
      <span className="truncate">
        {match.homeTeamName.split(' ')[0]}
        {' '}
        <span className="opacity-40 font-normal">vs</span>
        {' '}
        {match.awayTeamName.split(' ')[0]}
      </span>
    </button>
  )
}

// ─── Match Card (full — day view) ────────────────────────────────────────────

function MatchCardFull({
  match, isDragging, onDragStart, onDragEnd, onMatchClick, dragEnabled,
}: {
  match: AdminMatch
  isDragging: boolean
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
  onMatchClick?: (match: AdminMatch) => void
  dragEnabled?: boolean
}) {
  return (
    <div
      draggable={dragEnabled}
      onDragStart={dragEnabled ? e => onDragStart(e, match.id) : undefined}
      onDragEnd={dragEnabled ? onDragEnd : undefined}
      onClick={!dragEnabled && onMatchClick ? () => onMatchClick(match) : undefined}
      className={cn(
        'rounded-lg px-3 py-2.5 select-none',
        'border-l-[3px] transition-opacity',
        STATUS_CHIP[match.status],
        dragEnabled
          ? 'cursor-grab active:cursor-grabbing'
          : onMatchClick ? 'cursor-pointer hover:brightness-95 hover:shadow-sm' : '',
        isDragging && 'opacity-30',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">
          {match.homeTeamName}
          <span className="mx-1.5 text-xs font-normal opacity-50">vs</span>
          {match.awayTeamName}
        </p>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', STATUS_DOT[match.status])} />
          <span className="text-[10px] opacity-60 whitespace-nowrap">{STATUS_LABEL[match.status]}</span>
        </div>
      </div>
      <div className="flex items-center flex-wrap gap-x-4 gap-y-0.5 mt-1">
        {match.matchTime && (
          <span className="flex items-center gap-1 text-xs opacity-60">
            <Clock className="h-3 w-3" />
            {match.matchTime}
          </span>
        )}
        {match.venueName && (
          <span className="flex items-center gap-1 text-xs opacity-60">
            <MapPin className="h-3 w-3" />
            {match.venueName}
          </span>
        )}
        {match.tournamentName && (
          <span className="flex items-center gap-1 text-xs opacity-40">
            <Trophy className="h-3 w-3" />
            {match.tournamentName}
          </span>
        )}
        {match.categoryName && (
          <span className="text-xs opacity-40">{match.categoryName}</span>
        )}
      </div>
      {dragEnabled && (
        <div className="flex justify-end mt-1">
          <GripVertical className="h-3 w-3 opacity-20" />
        </div>
      )}
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  currentDate, matchesForDay, dropTarget,
  onDragOver, onDragLeave, onDrop, onDayClick, onMatchClick,
}: ViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 })
  const days       = eachDayOfInterval({ start: calStart, end: calEnd })
  const weeks      = Math.ceil(days.length / 7)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="grid grid-cols-7 bg-white border-b border-[#e8e6e1] shrink-0">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={cn(
              'py-2 text-center text-[11px] font-semibold uppercase tracking-wider select-none',
              i >= 5 ? 'text-[#ff3b2f]/60' : 'text-[#9b99a6]',
            )}
          >
            {d}
          </div>
        ))}
      </div>

      <div
        className="flex-1 min-h-0 grid grid-cols-7 overflow-hidden"
        style={{ gridTemplateRows: `repeat(${weeks}, 1fr)` }}
      >
        {days.map(day => {
          const key       = format(day, 'yyyy-MM-dd')
          const inMonth   = isSameMonth(day, currentDate)
          const today     = isToday(day)
          const isWeekend = day.getDay() === 0 || day.getDay() === 6
          const dayMs     = matchesForDay(day)
          const isOver    = dropTarget === key

          return (
            <div
              key={key}
              className={cn(
                'border-r border-b border-[#e8e6e1] p-1 flex flex-col min-h-0 overflow-hidden transition-colors duration-100',
                !inMonth              && 'bg-[#f0eeeb]',
                inMonth && isWeekend  && 'bg-[#fdf9f7]',
                inMonth && !isWeekend && 'bg-white',
                isOver                && 'bg-[#fff0ee] ring-1 ring-inset ring-[#ff3b2f]/25',
              )}
              onDragOver={e => onDragOver(e, key)}
              onDragLeave={onDragLeave}
              onDrop={e => onDrop(e, day)}
            >
              <div className="flex justify-end mb-0.5 shrink-0">
                <button
                  onClick={() => onDayClick?.(day)}
                  className={cn(
                    'h-[20px] w-[20px] flex items-center justify-center rounded-full',
                    'text-[11px] font-medium leading-none select-none transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3b2f]/50',
                    today
                      ? 'bg-[#ff3b2f] text-white font-bold'
                      : inMonth
                        ? isWeekend
                          ? 'text-[#ff3b2f]/70 hover:bg-[#fff0ee]'
                          : 'text-[#3d3c44] hover:bg-[#f0eeeb]'
                        : 'text-[#c4c2cc] hover:bg-[#e8e6e1]',
                  )}
                >
                  {format(day, 'd')}
                </button>
              </div>

              <div className="flex flex-col gap-[2px] overflow-hidden">
                {dayMs.slice(0, 3).map(m => (
                  <MatchChip
                    key={m.id}
                    match={m}
                    onMatchClick={onMatchClick ?? (() => {})}
                  />
                ))}
                {dayMs.length > 3 && (
                  <button
                    onClick={() => onDayClick?.(day)}
                    className="text-[9px] text-[#9b99a6] hover:text-[#ff3b2f] pl-1.5 leading-snug select-none text-left transition-colors"
                  >
                    +{dayMs.length - 3} más
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────────

const WEEK_ROW_H  = 56   // px per hour slot
const MATCH_DUR_M = 90   // default match duration in minutes

function weekMatchTop(match: AdminMatch): number {
  if (!match.matchTime) return (12 - HOURS[0]) * WEEK_ROW_H
  const [h, m] = match.matchTime.split(':').map(Number)
  return (h - HOURS[0]) * WEEK_ROW_H + (m / 60) * WEEK_ROW_H
}

function WeekMatchBlock({
  match, onMatchClick,
}: {
  match: AdminMatch
  onMatchClick: (m: AdminMatch) => void
}) {
  return (
    <button
      onClick={() => onMatchClick(match)}
      title={`${match.homeTeamName} vs ${match.awayTeamName}`}
      className={cn(
        'absolute inset-x-0.5 rounded overflow-hidden text-left',
        'border-l-[3px] px-1.5 py-1 select-none z-10',
        'hover:brightness-95 hover:shadow-sm cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#ff3b2f]/50 transition-all',
        STATUS_CHIP[match.status],
      )}
      style={{
        top:    weekMatchTop(match),
        height: (MATCH_DUR_M / 60) * WEEK_ROW_H,
      }}
    >
      {match.matchTime && (
        <p className="text-[9px] opacity-55 font-normal leading-none mb-0.5">{match.matchTime} hs</p>
      )}
      <p className="text-[10px] font-semibold leading-snug truncate">{match.homeTeamName.split(' ')[0]}</p>
      <p className="text-[9px] opacity-40 leading-none my-px">vs</p>
      <p className="text-[10px] font-semibold leading-snug truncate">{match.awayTeamName.split(' ')[0]}</p>
    </button>
  )
}

function WeekView({
  currentDate, matchesForDay, onDayClick, onMatchClick,
}: ViewProps) {
  const weekStart  = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days       = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const totalH     = HOURS.length * WEEK_ROW_H

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Day headers */}
      <div
        className="grid shrink-0 border-b border-[#e8e6e1] bg-white"
        style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}
      >
        <div className="border-r border-[#e8e6e1]" />
        {days.map((day, i) => {
          const today     = isToday(day)
          const isWeekend = i >= 5
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              className={cn(
                'py-2 text-center border-r border-[#e8e6e1] last:border-r-0',
                'transition-colors hover:bg-[#f7f6f4] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff3b2f]/40',
              )}
            >
              <div className={cn(
                'text-[10px] font-semibold uppercase tracking-wider select-none',
                isWeekend ? 'text-[#ff3b2f]/60' : 'text-[#9b99a6]',
              )}>
                {DAY_LABELS[i]}
              </div>
              <div className={cn(
                'mx-auto mt-0.5 h-6 w-6 flex items-center justify-center rounded-full text-[12px] font-semibold leading-none select-none transition-colors',
                today     ? 'bg-[#ff3b2f] text-white' :
                isWeekend ? 'text-[#ff3b2f]/80' :
                            'text-[#3d3c44]',
              )}>
                {format(day, 'd')}
              </div>
            </button>
          )
        })}
      </div>

      {/* Time grid + positioned events */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex" style={{ height: totalH }}>

          {/* Time axis */}
          <div className="w-14 shrink-0 border-r border-[#e8e6e1]">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="flex items-start justify-end pr-2 pt-1 border-b border-[#e8e6e1] text-[10px] text-[#b0aebe] font-medium select-none"
                style={{ height: WEEK_ROW_H }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, i) => {
            const isWeekend = i >= 5
            const dayMs     = matchesForDay(day)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex-1 relative border-r border-[#e8e6e1] last:border-r-0',
                  isWeekend && 'bg-[#fdf9f7]',
                )}
              >
                {/* Hour grid lines */}
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="border-b border-[#e8e6e1]"
                    style={{ height: WEEK_ROW_H }}
                  />
                ))}

                {/* Positioned match blocks */}
                {dayMs.map(match => (
                  <WeekMatchBlock
                    key={match.id}
                    match={match}
                    onMatchClick={onMatchClick ?? (() => {})}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  currentDate, matchesForDay, draggedId, dropTarget,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onMatchClick, dragEnabled,
}: ViewProps) {
  const dayMatches  = matchesForDay(currentDate)
  const isWeekend   = currentDate.getDay() === 0 || currentDate.getDay() === 6
  const unscheduled = dayMatches.filter(m => !m.matchTime)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="bg-white border-b border-[#e8e6e1] px-5 py-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-10 w-10 flex items-center justify-center rounded-full text-sm font-bold select-none',
            isToday(currentDate)
              ? 'bg-[#ff3b2f] text-white'
              : isWeekend
                ? 'bg-[#fff0ee] text-[#ff3b2f]'
                : 'bg-[#f0eeeb] text-[#3d3c44]',
          )}>
            {format(currentDate, 'd')}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f0e13] capitalize select-none">
              {format(currentDate, 'EEEE', { locale: es })}
            </p>
            <p className="text-xs text-[#9b99a6] capitalize select-none">
              {format(currentDate, "d 'de' MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <div className="text-xs text-[#9b99a6] select-none">
          {dayMatches.length} partido{dayMatches.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {unscheduled.length > 0 && (
          <div className="mx-4 mt-3 mb-2 p-3 rounded-xl border border-dashed border-[#e0deda] space-y-2">
            <p className="text-[10px] text-[#9b99a6] font-semibold uppercase tracking-wider select-none">
              Sin horario asignado
            </p>
            {unscheduled.map(m => (
              <MatchCardFull
                key={m.id}
                match={m}
                isDragging={draggedId === m.id}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onMatchClick={onMatchClick}
                dragEnabled={dragEnabled}
              />
            ))}
          </div>
        )}

        {HOURS.map(hour => {
          const key    = `${format(currentDate, 'yyyy-MM-dd')}-${hour}`
          const isOver = dropTarget === key
          const hourMs = dayMatches.filter(m => {
            if (!m.matchTime) return false
            return parseInt(m.matchTime.split(':')[0]) === hour
          })

          return (
            <div
              key={key}
              className={cn(
                'grid border-b border-[#e8e6e1] transition-colors duration-100',
                isOver && 'bg-[#fff0ee]',
              )}
              style={{ gridTemplateColumns: '3.5rem 1fr', minHeight: '3.5rem' }}
              onDragOver={dragEnabled ? e => onDragOver(e, key) : undefined}
              onDragLeave={dragEnabled ? onDragLeave : undefined}
              onDrop={dragEnabled ? e => onDrop(e, currentDate) : undefined}
            >
              <div className="flex items-start justify-end pr-3 pt-2 text-[10px] text-[#b0aebe] font-medium border-r border-[#e8e6e1] shrink-0 select-none">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className="p-1.5 space-y-1.5">
                {hourMs.map(m => (
                  <MatchCardFull
                    key={m.id}
                    match={m}
                    isDragging={draggedId === m.id}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onMatchClick={onMatchClick}
                    dragEnabled={dragEnabled}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
