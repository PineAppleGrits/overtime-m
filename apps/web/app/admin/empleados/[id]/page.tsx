'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import employeeService from '@/modules/admin/services/EmployeeService'
import { Employee, AssignedMatch } from '@/modules/admin/types'
import { toast } from 'sonner'
import { Loader2, Calendar, MapPin, Clock } from 'lucide-react'

export default function EmployeeDetailPage() {
  const params = useParams()
  const employeeId = params.id as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEmployee = useCallback(async () => {
    try {
      const response = await employeeService.getEmployeeById(employeeId)
      setEmployee(response.data ?? response)
    } catch {
      toast.error('Error al cargar empleado')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => {
    fetchEmployee()
  }, [fetchEmployee])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!employee) {
    return <div className="py-12 text-center text-muted-foreground">Empleado no encontrado</div>
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
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Activo</Badge>
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
