'use client'

import { useState, useCallback, useTransition, useRef } from 'react'
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
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, CalendarDays } from 'lucide-react'
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
  matchDate: string   // YYYY-MM-DD
  matchTime?: string  // HH:mm
  venueName?: string
  status: MatchStatus
  categoryName?: string
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
  const [, startTransition]           = useTransition()
  const dateInputRef                  = useRef<HTMLInputElement>(null)

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

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return
    setCurrentDate(parseISO(e.target.value))
  }

  // ── DnD ──────────────────────────────────────────────────────────────────

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

    // Optimistic update
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-[#f7f6f4] overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-5 h-13 bg-white border-b border-[#e8e6e1] shrink-0 gap-4">
        {/* Left: navigation */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={goPrev}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#f0eeeb] text-[#6b6a72] hover:text-[#0f0e13] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="h-8 px-3 text-xs font-medium rounded-lg border border-[#e8e6e1] hover:bg-[#f0eeeb] text-[#6b6a72] hover:text-[#0f0e13] transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={goNext}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#f0eeeb] text-[#6b6a72] hover:text-[#0f0e13] transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="ml-3 text-[15px] font-semibold text-[#0f0e13] capitalize truncate select-none">
            {titleLabel()}
          </h2>

          {/* Date picker trigger */}
          <div className="relative ml-1">
            <button
              onClick={() => dateInputRef.current?.showPicker()}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#f0eeeb] text-[#9b99a6] hover:text-[#0f0e13] transition-colors"
              title="Ir a una fecha"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={format(currentDate, 'yyyy-MM-dd')}
              onChange={handleDatePickerChange}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              tabIndex={-1}
            />
          </div>
        </div>

        {/* Right: view switcher + new match */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex rounded-lg border border-[#e8e6e1] overflow-hidden text-[12px] font-medium">
            {(['month', 'week', 'day'] as CalendarView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'px-3.5 h-8 transition-all duration-150',
                  view === v
                    ? 'bg-[#ff3b2f] text-white'
                    : 'bg-white text-[#6b6a72] hover:bg-[#f0eeeb] hover:text-[#0f0e13]',
                )}
              >
                {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 h-8 px-3.5 bg-[#ff3b2f] hover:bg-[#e0342a] active:bg-[#c42e25] text-white text-[12px] font-semibold rounded-lg transition-colors shadow-sm shadow-[#ff3b2f]/20">
            <Plus className="h-3.5 w-3.5" />
            Nuevo partido
          </button>
        </div>
      </div>

      {/* ── Calendar Content ── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            matchesForDay={matchesForDay}
            draggedId={draggedId}
            dropTarget={dropTarget}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDayClick={navigateToDay}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            matchesForDay={matchesForDay}
            draggedId={draggedId}
            dropTarget={dropTarget}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDayClick={navigateToDay}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            matchesForDay={matchesForDay}
            draggedId={draggedId}
            dropTarget={dropTarget}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
}

// ─── Match Chip (compact — used in Month/Week views) ─────────────────────────

function MatchChip({
  match, isDragging, onDragStart, onDragEnd,
}: {
  match: AdminMatch
  isDragging: boolean
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, match.id)}
      onDragEnd={onDragEnd}
      title={`${match.homeTeamName} vs ${match.awayTeamName}${match.matchTime ? ' · ' + match.matchTime : ''}${match.venueName ? ' @ ' + match.venueName : ''}`}
      className={cn(
        'rounded px-1.5 py-[2px] text-[10px] leading-snug font-medium',
        'border-l-[3px] cursor-grab active:cursor-grabbing select-none',
        'flex items-center gap-1 min-w-0 transition-opacity truncate',
        STATUS_CHIP[match.status],
        isDragging ? 'opacity-30' : 'hover:brightness-95',
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
    </div>
  )
}

// ─── Match Card (full — used in Day view) ────────────────────────────────────

function MatchCardFull({
  match, isDragging, onDragStart, onDragEnd,
}: {
  match: AdminMatch
  isDragging: boolean
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, match.id)}
      onDragEnd={onDragEnd}
      className={cn(
        'rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing select-none',
        'border-l-[3px] transition-opacity',
        STATUS_CHIP[match.status],
        isDragging ? 'opacity-30' : 'hover:brightness-95',
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
        {match.categoryName && (
          <span className="text-xs opacity-40">{match.categoryName}</span>
        )}
      </div>
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  currentDate, matchesForDay, draggedId, dropTarget,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onDayClick,
}: ViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 })
  const days       = eachDayOfInterval({ start: calStart, end: calEnd })
  const weeks      = Math.ceil(days.length / 7)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Day of week headers */}
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

      {/* Days grid */}
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
                !inMonth                    && 'bg-[#f0eeeb]',
                inMonth && isWeekend        && 'bg-[#fdf9f7]',
                inMonth && !isWeekend       && 'bg-white',
                isOver                      && 'bg-[#fff0ee] ring-1 ring-inset ring-[#ff3b2f]/25',
              )}
              onDragOver={e => onDragOver(e, key)}
              onDragLeave={onDragLeave}
              onDrop={e => onDrop(e, day)}
            >
              {/* Day number — clickable to drill into day view */}
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

              {/* Match chips */}
              <div className="flex flex-col gap-[2px] overflow-hidden">
                {dayMs.slice(0, 3).map(m => (
                  <MatchChip
                    key={m.id}
                    match={m}
                    isDragging={draggedId === m.id}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
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

function WeekView({
  currentDate, matchesForDay, draggedId, dropTarget,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onDayClick,
}: ViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Column headers — clickable to drill into day view */}
      <div
        className="grid shrink-0 border-b border-[#e8e6e1] bg-white"
        style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)' }}
      >
        <div className="border-r border-[#e8e6e1]" />
        {days.map((day, i) => {
          const today      = isToday(day)
          const isWeekend  = i >= 5
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
                today        ? 'bg-[#ff3b2f] text-white' :
                isWeekend    ? 'text-[#ff3b2f]/80 group-hover:bg-[#fff0ee]' :
                               'text-[#3d3c44]',
              )}>
                {format(day, 'd')}
              </div>
            </button>
          )
        })}
      </div>

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {HOURS.map(hour => (
          <div
            key={hour}
            className="grid border-b border-[#e8e6e1]"
            style={{ gridTemplateColumns: '3.5rem repeat(7, 1fr)', minHeight: '3.5rem' }}
          >
            {/* Hour label */}
            <div className="flex items-start justify-end pr-2 pt-1 text-[10px] text-[#b0aebe] border-r border-[#e8e6e1] shrink-0 font-medium select-none">
              {String(hour).padStart(2, '0')}:00
            </div>

            {/* Day columns */}
            {days.map((day, i) => {
              const key       = `${format(day, 'yyyy-MM-dd')}-${hour}`
              const isOver    = dropTarget === key
              const isWeekend = i >= 5
              const hourMs    = matchesForDay(day).filter(m => {
                if (!m.matchTime) return hour === 12 // unscheduled → noon
                return parseInt(m.matchTime.split(':')[0]) === hour
              })

              return (
                <div
                  key={key}
                  className={cn(
                    'border-r border-[#e8e6e1] last:border-r-0 p-0.5 space-y-0.5 transition-colors duration-100',
                    isWeekend && 'bg-[#fdf9f7]',
                    isOver    && 'bg-[#fff0ee] ring-1 ring-inset ring-[#ff3b2f]/25',
                  )}
                  onDragOver={e => onDragOver(e, key)}
                  onDragLeave={onDragLeave}
                  onDrop={e => onDrop(e, day)}
                >
                  {hourMs.map(m => (
                    <MatchChip
                      key={m.id}
                      match={m}
                      isDragging={draggedId === m.id}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  currentDate, matchesForDay, draggedId, dropTarget,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
}: ViewProps) {
  const dayMatches  = matchesForDay(currentDate)
  const isWeekend   = currentDate.getDay() === 0 || currentDate.getDay() === 6
  const unscheduled = dayMatches.filter(m => !m.matchTime)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Day header */}
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Unscheduled */}
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
              />
            ))}
          </div>
        )}

        {/* Time slots */}
        {HOURS.map(hour => {
          const key     = `${format(currentDate, 'yyyy-MM-dd')}-${hour}`
          const isOver  = dropTarget === key
          const hourMs  = dayMatches.filter(m => {
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
              onDragOver={e => onDragOver(e, key)}
              onDragLeave={onDragLeave}
              onDrop={e => onDrop(e, currentDate)}
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
