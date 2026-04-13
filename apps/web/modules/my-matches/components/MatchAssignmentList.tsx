'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarCheck, CheckCircle2, AlertTriangle, AlertCircle, CalendarX2 } from 'lucide-react'
import { MatchAssignmentCard } from './MatchAssignmentCard'
import type { MyMatchAssignment } from '../types'

interface MatchAssignmentListProps {
  assignments: MyMatchAssignment[]
  error?: string | null
}

export function MatchAssignmentList({ assignments, error }: MatchAssignmentListProps) {
  const upcoming = assignments.filter(
    (a) => a.match.status === 'programado' || a.match.status === 'reprogramado'
  )

  const inProgress = assignments.filter(
    (a) => a.match.status === 'en_curso'
  )

  const finished = assignments.filter(
    (a) => a.match.status === 'finalizado'
  )

  const other = assignments.filter(
    (a) => ['suspendido', 'cancelado'].includes(a.match.status)
  )

  const sortByDate = (a: MyMatchAssignment, b: MyMatchAssignment) =>
    new Date(a.match.matchDate).getTime() - new Date(b.match.matchDate).getTime()

  const upcomingSorted = [...upcoming].sort(sortByDate)
  const inProgressSorted = [...inProgress].sort(sortByDate)
  const finishedSorted = [...finished].sort(
    (a, b) => new Date(b.match.matchDate).getTime() - new Date(a.match.matchDate).getTime()
  )
  const otherSorted = [...other].sort(
    (a, b) => new Date(b.match.matchDate).getTime() - new Date(a.match.matchDate).getTime()
  )

  const defaultTab = inProgressSorted.length > 0
    ? 'in-progress'
    : upcomingSorted.length > 0
      ? 'upcoming'
      : 'upcoming'

  const isEmpty = assignments.length === 0 && !error

  return (
    <div className="space-y-4">
      {/* Error banner — always visible when there's an error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="flex-wrap">
          {inProgressSorted.length > 0 && (
            <TabsTrigger value="in-progress" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              En curso ({inProgressSorted.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="upcoming" className="gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5" />
            Próximos ({upcomingSorted.length})
          </TabsTrigger>
          <TabsTrigger value="finished" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Finalizados ({finishedSorted.length})
          </TabsTrigger>
          {otherSorted.length > 0 && (
            <TabsTrigger value="other">
              Otros ({otherSorted.length})
            </TabsTrigger>
          )}
        </TabsList>

        {inProgressSorted.length > 0 && (
          <TabsContent value="in-progress">
            <MatchListSection
              matches={inProgressSorted}
              emptyMessage="No hay partidos en curso"
            />
          </TabsContent>
        )}

        <TabsContent value="upcoming">
          {isEmpty ? (
            <EmptyState />
          ) : (
            <MatchListSection
              matches={upcomingSorted}
              emptyMessage="No tenés partidos programados próximamente"
            />
          )}
        </TabsContent>

        <TabsContent value="finished">
          {isEmpty ? (
            <EmptyState />
          ) : (
            <MatchListSection
              matches={finishedSorted}
              emptyMessage="Todavía no tenés partidos finalizados"
            />
          )}
        </TabsContent>

        {otherSorted.length > 0 && (
          <TabsContent value="other">
            <MatchListSection
              matches={otherSorted}
              emptyMessage="No hay partidos suspendidos o cancelados"
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function MatchListSection({
  matches,
  emptyMessage,
}: {
  matches: MyMatchAssignment[]
  emptyMessage: string
}) {
  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((assignment) => (
        <MatchAssignmentCard key={assignment.id} assignment={assignment} />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarX2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold text-foreground">
          Sin partidos asignados
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Todavía no tenés partidos asignados. Cuando un administrador te asigne
          un partido, lo vas a ver acá.
        </p>
      </CardContent>
    </Card>
  )
}
