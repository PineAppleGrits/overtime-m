'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { AlertCircle, Calendar, MapPin, Clock } from 'lucide-react'
import employeeBrowserService from '@/modules/admin/services/EmployeeService'
import { Employee, AssignedMatch } from '@/modules/admin/types'

interface EmployeeDetailContentProps {
  employeeId: string
  initialData: { data: Employee | null; error: string | null }
}

export function EmployeeDetailContent({ employeeId, initialData }: EmployeeDetailContentProps) {
  const { data: employee, isPending, isError, refetch } = useQuery({
    queryKey: ['admin', 'employee', employeeId],
    queryFn: async () => {
      const response = await employeeBrowserService.getEmployeeById(employeeId)
      return (response.data ?? response) as Employee
    },
    initialData: !initialData.error && initialData.data ? initialData.data : undefined,
  })

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Empleado" description="Detalle del empleado" backHref="/admin/empleados" />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar el empleado</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  if (isPending || !employee) {
    return (
      <div>
        <PageHeader title="Empleado" description="Cargando..." backHref="/admin/empleados" />
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-40 rounded bg-muted" />
        </div>
      </div>
    )
  }

  const upcomingMatches = employee.assignedMatches?.filter(
    (am) => am.match.status === 'programado' || am.match.status === 'reprogramado'
  ) ?? []

  const playedMatches = employee.assignedMatches?.filter(
    (am) => am.match.status === 'finalizado'
  ) ?? []

  const otherMatches = employee.assignedMatches?.filter(
    (am) => !['programado', 'reprogramado', 'finalizado'].includes(am.match.status)
  ) ?? []

  const MatchCard = ({ assignment }: { assignment: AssignedMatch }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">
              {assignment.match.homeTeamName} vs {assignment.match.awayTeamName}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(assignment.match.matchDate).toLocaleDateString('es-AR')}
              </span>
              {assignment.match.matchTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {assignment.match.matchTime}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {assignment.match.venueName}
              </span>
            </div>
            {assignment.match.status === 'finalizado' && (
              <p className="text-sm font-semibold">
                {assignment.match.homeScore} - {assignment.match.awayScore}
              </p>
            )}
          </div>
          <StatusBadge status={assignment.match.status} type="match" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        description="Detalle del empleado y partidos asignados"
        backHref="/admin/empleados"
      />

      <div className="mb-6 flex items-center gap-3">
        <StatusBadge status={employee.role} type="employee" />
        {employee.isActive ? (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Activo</Badge>
        ) : (
          <Badge variant="outline">Inactivo</Badge>
        )}
        {employee.email && (
          <span className="text-sm text-muted-foreground">{employee.email}</span>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Por jugar ({upcomingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="played">
            Jugados ({playedMatches.length})
          </TabsTrigger>
          {otherMatches.length > 0 && (
            <TabsTrigger value="other">
              Otros ({otherMatches.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingMatches.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay partidos programados
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map((am) => (
                <MatchCard key={am.id} assignment={am} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="played">
          {playedMatches.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay partidos jugados
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {playedMatches.map((am) => (
                <MatchCard key={am.id} assignment={am} />
              ))}
            </div>
          )}
        </TabsContent>

        {otherMatches.length > 0 && (
          <TabsContent value="other">
            <div className="space-y-3">
              {otherMatches.map((am) => (
                <MatchCard key={am.id} assignment={am} />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
