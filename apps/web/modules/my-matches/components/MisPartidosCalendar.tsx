'use client'

import { useMemo, useState } from 'react'
import { es } from 'date-fns/locale'
import { AlertCircle, CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MatchAssignmentCard } from './MatchAssignmentCard'
import type { MyMatchAssignment } from '../types'

interface MisPartidosCalendarProps {
  assignments: MyMatchAssignment[]
  error?: string | null
}

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function MisPartidosCalendar({ assignments, error }: MisPartidosCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [pickerOpen, setPickerOpen] = useState(false)

  const matchDays = useMemo(() => {
    const map = new Map<string, MyMatchAssignment[]>()
    for (const a of assignments) {
      const d = new Date(a.match.matchDate)
      if (Number.isNaN(d.getTime())) continue
      const key = dayKey(d)
      const bucket = map.get(key) ?? []
      bucket.push(a)
      map.set(key, bucket)
    }
    return map
  }, [assignments])

  const matchDates = useMemo(
    () => Array.from(matchDays.keys()).map((k) => new Date(`${k}T00:00:00`)),
    [matchDays]
  )

  const dayAssignments = selectedDate
    ? (matchDays.get(dayKey(selectedDate)) ?? [])
    : []

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
        {/* Calendario: popover compacto en mobile, inline en desktop */}
        <div>
          <div className="lg:hidden">
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-[#e8e6e1] font-normal"
                >
                  <CalendarIcon className="h-4 w-4 text-[#6b6a72]" />
                  {selectedDate
                    ? selectedDate.toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                    : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d)
                    setPickerOpen(false)
                  }}
                  locale={es}
                  modifiers={{ hasMatch: matchDates }}
                  modifiersClassNames={{
                    hasMatch:
                      'data-[selected-single=false]:rounded-full data-[selected-single=false]:bg-[#ff3b2f]/12 data-[selected-single=false]:text-[#ff3b2f] data-[selected-single=false]:font-semibold data-[selected-single=false]:hover:bg-[#ff3b2f]/20',
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="hidden lg:block rounded-xl bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              modifiers={{ hasMatch: matchDates }}
              modifiersClassNames={{
                hasMatch:
                  'data-[selected-single=false]:rounded-full data-[selected-single=false]:bg-[#ff3b2f]/12 data-[selected-single=false]:text-[#ff3b2f] data-[selected-single=false]:font-semibold data-[selected-single=false]:hover:bg-[#ff3b2f]/20',
              }}
            />
          </div>
        </div>

        {/* Listado del día (siempre visible) */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9b99a6]">
            {selectedDate
              ? `Partidos del ${selectedDate.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}`
              : 'Seleccioná un día'}
          </h3>

          {dayAssignments.length === 0 ? (
            <div className="rounded-xl bg-white py-12 text-center text-[13px] text-[#9b99a6] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              No tenés partidos asignados para este día.
            </div>
          ) : (
            <div className="space-y-3">
              {dayAssignments.map((a) => (
                <MatchAssignmentCard key={a.id} assignment={a} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
