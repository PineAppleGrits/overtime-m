'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import employeeService from '@/modules/admin/services/EmployeeService'
import { AssignedMatch } from '@/modules/admin/types'
import { toast } from 'sonner'
import { Calendar, Clock, MapPin, Loader2, Trophy, Camera, ClipboardList, Gavel } from 'lucide-react'

export default function AdminProfilePage() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState<AssignedMatch[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await employeeService.getMyAssignments()
      setAssignments(response.data ?? response ?? [])
    } catch {
      // User might not be an employee, that's fine
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const upcomingMatches = assignments.filter(
    (am) => am.match.status === 'programado' || am.match.status === 'reprogramado'
  )

  const playedMatches = assignments.filter(
    (am) => am.match.status === 'finalizado'
  )

  const inProgressMatches = assignments.filter(
    (am) => am.match.status === 'en_curso'
  )

  const roleIcon = (role: string) => {
    switch (role) {
      case 'arbitro': return <Gavel className="h-4 w-4" />
      case 'fotografo': return <Camera className="h-4 w-4" />
      case 'agente_mesa': return <ClipboardList className="h-4 w-4" />
      default: return <Trophy className="h-4 w-4" />
    }
  }

  const MatchCard = ({ assignment }: { assignment: AssignedMatch }) => (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {roleIcon(assignment.role)}
              <StatusBadge status={assignment.role} type="employee" />
            </div>
            <p className="text-lg font-semibold">
              {assignment.match.homeTeamName} vs {assignment.match.awayTeamName}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(assignment.match.matchDate).toLocaleDateString('es-AR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              {assignment.match.matchTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {assignment.match.matchTime}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {assignment.match.venueName}
              </span>
            </div>
            {assignment.match.status === 'finalizado' && (
              <p className="text-xl font-bold">
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
      <PageHeader title="Mi Perfil" description="Información de tu cuenta y partidos asignados" />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="items-center text-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatarUrl} alt={profile?.name} />
              <AvatarFallback className="text-2xl">
                {profile?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-3">{profile?.name}</CardTitle>
            <CardDescription>{profile?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Roles</span>
                <div className="flex gap-1">
                  {profile?.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              {profile?.documentNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">DNI</span>
                  <span>{profile.documentNumber}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Perfil jugador</span>
                <span>{profile?.hasPlayerProfile ? 'Sí' : 'No'}</span>
              </div>
              {profile?.playerName && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nombre jugador</span>
                  <span>{profile.playerName}</span>
                </div>
              )}
              <Separator />
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Resumen de asignaciones</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-blue-50 p-2 dark:bg-blue-950">
                    <p className="text-lg font-bold text-blue-600">{upcomingMatches.length}</p>
                    <p className="text-xs text-muted-foreground">Por jugar</p>
                  </div>
                  <div className="rounded-md bg-yellow-50 p-2 dark:bg-yellow-950">
                    <p className="text-lg font-bold text-yellow-600">{inProgressMatches.length}</p>
                    <p className="text-xs text-muted-foreground">En curso</p>
                  </div>
                  <div className="rounded-md bg-green-50 p-2 dark:bg-green-950">
                    <p className="text-lg font-bold text-green-600">{playedMatches.length}</p>
                    <p className="text-xs text-muted-foreground">Jugados</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matches section */}
        <div className="md:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-lg font-medium text-muted-foreground">
                  Sin partidos asignados
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cuando te asignen como árbitro, fotógrafo o agente de mesa, los partidos aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upcoming">
                  Por jugar ({upcomingMatches.length})
                </TabsTrigger>
                {inProgressMatches.length > 0 && (
                  <TabsTrigger value="inprogress">
                    En curso ({inProgressMatches.length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="played">
                  Jugados ({playedMatches.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                {upcomingMatches.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No tienes partidos próximos asignados
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

              {inProgressMatches.length > 0 && (
                <TabsContent value="inprogress">
                  <div className="space-y-3">
                    {inProgressMatches.map((am) => (
                      <MatchCard key={am.id} assignment={am} />
                    ))}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="played">
                {playedMatches.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No tienes partidos jugados
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
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}
