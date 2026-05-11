'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { Calendar, Clock, MapPin, Trophy, Loader2, Pencil, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { updateMatchScoreAction, changeMatchStatusAction } from '../actions/matchActions'
import type { MyMatchAssignment, MatchStatus } from '../types'

const ROLE_LABELS: Record<string, string> = {
  arbitro: 'Árbitro',
  fotografo: 'Fotógrafo',
  agente_mesa: 'Agente de Mesa',
}

interface MatchAssignmentCardProps {
  assignment: MyMatchAssignment
}

export function MatchAssignmentCard({ assignment }: MatchAssignmentCardProps) {
  const { match, role } = assignment
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() ?? '0')
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() ?? '0')
  const [newStatus, setNewStatus] = useState<MatchStatus>(match.status)
  const [saving, setSaving] = useState(false)

  const canEditScore = role === 'agente_mesa' || role === 'arbitro'
  const canChangeStatus = role === 'arbitro'
  const isActionable = match.status === 'programado' || match.status === 'en_curso' || match.status === 'reprogramado'

  const formattedDate = new Date(match.matchDate).toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  const handleUpdateScore = async () => {
    setSaving(true)
    const result = await updateMatchScoreAction({
      matchId: match.id,
      homeScore: parseInt(homeScore, 10),
      awayScore: parseInt(awayScore, 10),
    })
    setSaving(false)

    if (result.success) {
      toast.success('Marcador actualizado')
      setScoreDialogOpen(false)
    } else {
      toast.error(result.error ?? 'Error al actualizar')
    }
  }

  const handleChangeStatus = async () => {
    setSaving(true)
    const result = await changeMatchStatusAction({
      matchId: match.id,
      status: newStatus,
    })
    setSaving(false)

    if (result.success) {
      toast.success('Estado actualizado')
      setStatusDialogOpen(false)
    } else {
      toast.error(result.error ?? 'Error al cambiar estado')
    }
  }

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold">
                  {match.homeTeamName} vs {match.awayTeamName}
                </p>
                <StatusBadge status={match.status} type="match" />
              </div>

              {match.status === 'finalizado' && match.homeScore != null && match.awayScore != null && (
                <p className="text-lg font-bold tabular-nums">
                  {match.homeScore} - {match.awayScore}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {formattedDate}
                </span>
                {match.matchTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {match.matchTime}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {match.venueName}
                </span>
                {match.tournamentName && (
                  <span className="flex items-center gap-1">
                    <Trophy className="size-3.5" />
                    {match.tournamentName}
                    {match.categoryName && ` · ${match.categoryName}`}
                  </span>
                )}
              </div>

              <Badge variant="outline" className="text-xs">
                {ROLE_LABELS[role] ?? role}
              </Badge>
            </div>

            {isActionable && (
              <div className="flex shrink-0 gap-2">
                {canEditScore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScoreDialogOpen(true)}
                  >
                    <Pencil className="mr-1.5 size-3.5" />
                    Marcador
                  </Button>
                )}
                {canChangeStatus && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStatusDialogOpen(true)}
                  >
                    <RefreshCw className="mr-1.5 size-3.5" />
                    Estado
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Update Score Dialog */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Actualizar marcador</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {match.homeTeamName} vs {match.awayTeamName}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{match.homeTeamName}</Label>
              <Input
                type="number"
                min={0}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{match.awayTeamName}</Label>
              <Input
                type="number"
                min={0}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateScore} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar estado del partido</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {match.homeTeamName} vs {match.awayTeamName}
          </p>
          <div className="space-y-2">
            <Label>Nuevo estado</Label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as MatchStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="programado">Programado</SelectItem>
                <SelectItem value="en_curso">En curso</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="reprogramado">Reprogramado</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeStatus} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
