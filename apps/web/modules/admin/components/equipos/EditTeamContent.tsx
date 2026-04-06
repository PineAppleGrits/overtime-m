'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertCircle, CalendarDays, Loader2, Receipt, Trash2, Trophy, UserPlus } from 'lucide-react'
import teamBrowserService from '@/modules/admin/services/browser/teamService'
import playerBrowserService from '@/modules/admin/services/browser/playerService'
import { updateTeamAction, addPlayerToTeamAction, removePlayerFromTeamAction } from '@/modules/admin/actions/teamActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { AdminTeam } from '@/modules/admin/types'

interface Sport {
  id: string
  name: string
}

interface EditTeamContentProps {
  teamId: string
  initialData: { data: AdminTeam | null; error: string | null }
  sports: Sport[]
}

export function EditTeamContent({ teamId, initialData, sports }: EditTeamContentProps) {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'general'
  const qc = useQueryClient()

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['admin', 'team', teamId] }), [qc, teamId])

  const { data: team, isPending, isError, refetch } = useQuery({
    queryKey: ['admin', 'team', teamId],
    queryFn: async () => {
      const response = await teamBrowserService.getTeamById(teamId)
      return (response.data ?? response) as AdminTeam
    },
    initialData: !initialData.error && initialData.data ? initialData.data : undefined,
  })

  const [form, setForm] = useState({
    name: initialData.data?.name ?? '',
    logoUrl: initialData.data?.logoUrl ?? '',
    sportId: initialData.data?.sportId ?? '',
  })

  // Players
  const [allPlayers, setAllPlayers] = useState<{ id: string; firstName: string; lastName: string }[]>([])
  const [playerDialog, setPlayerDialog] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState('')

  const updateAction = useServerAction(updateTeamAction, { successMessage: 'Equipo actualizado', onSuccess: invalidate })
  const addPlayerAction = useServerAction(addPlayerToTeamAction, {
    successMessage: 'Jugador agregado',
    onSuccess: () => { invalidate(); setPlayerDialog(false); setSelectedPlayerId('') },
  })
  const removePlayerAction = useServerAction(removePlayerFromTeamAction, { successMessage: 'Jugador removido', onSuccess: invalidate })

  const fetchAllPlayers = async () => {
    try {
      const response = await playerBrowserService.getPlayers({ limit: 100 })
      setAllPlayers(response.data?.data ?? response.data ?? [])
    } catch { /* ignored */ }
  }

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Equipo" description="Detalle del equipo" backHref="/admin/equipos" />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar el equipo</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  if (isPending || !team) {
    return (
      <div>
        <PageHeader title="Equipo" description="Cargando..." backHref="/admin/equipos" />
        <div className="animate-pulse space-y-4"><div className="h-6 w-48 rounded bg-muted" /><div className="h-40 rounded bg-muted" /></div>
      </div>
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateAction.execute({ id: teamId, name: form.name, logoUrl: form.logoUrl || undefined, sportId: form.sportId })
  }

  return (
    <div>
      <PageHeader title={team.name} description="Edita la información del equipo y gestiona sus jugadores" backHref="/admin/equipos" />

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="players">Jugadores ({team.players?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="torneos">Torneos</TabsTrigger>
          <TabsTrigger value="deudas">Deudas</TabsTrigger>
          <TabsTrigger value="partidos">Partidos</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSave} className="max-w-2xl space-y-6">
            <Card>
              <CardHeader><CardTitle>Información del equipo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>URL del logo</Label>
                  <Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
                  {form.logoUrl && (
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={form.logoUrl} alt={form.name} />
                      <AvatarFallback>{form.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Disciplina</Label>
                  <Select value={form.sportId} onValueChange={(v) => setForm({ ...form, sportId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sports.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Button type="submit" disabled={updateAction.isPending}>
              {updateAction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="players">
          <div className="max-w-2xl space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { fetchAllPlayers(); setPlayerDialog(true) }}>
                <UserPlus className="mr-2 h-4 w-4" />Agregar jugador
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {!team.players || team.players.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No hay jugadores en este equipo</p>
                ) : (
                  <div className="divide-y">
                    {team.players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={player.photoUrl} />
                            <AvatarFallback className="text-xs">{player.firstName?.charAt(0)}{player.lastName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{player.firstName} {player.lastName}</p>
                            <p className="text-xs text-muted-foreground">{player.position ?? 'Sin posición'} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removePlayerAction.execute({ teamId, playerId: player.playerId })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Dialog open={playerDialog} onOpenChange={setPlayerDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>Agregar jugador</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Jugador</Label>
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar jugador" /></SelectTrigger>
                    <SelectContent>
                      {allPlayers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPlayerDialog(false)}>Cancelar</Button>
                <Button onClick={() => addPlayerAction.execute({ teamId, playerId: selectedPlayerId })} disabled={addPlayerAction.isPending}>
                  {addPlayerAction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Agregar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── Torneos ────────────────────────────────────────────────── */}
        <TabsContent value="torneos">
          <div className="max-w-2xl space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {!((team as any).zones as unknown[])?.length ? (
              <div className="rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f6f4]">
                  <Trophy className="h-5 w-5 text-[#c4c2cc]" />
                </div>
                <p className="text-sm font-medium text-[#6b6a72]">Sin torneos registrados</p>
                <p className="mt-1 text-xs text-[#c4c2cc]">Este equipo no está inscrito en ningún torneo.</p>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#e8e6e1]">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {((team as any).zones as Array<{ id: string; name: string; tournament?: { id: string; name: string }; category?: { id: string; name: string } }> ?? []).map((zone) => (
                      <div key={zone.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f7f6f4]">
                          <Trophy className="h-4 w-4 text-[#ff3b2f]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#0f0e13] truncate">
                            {zone.tournament?.name ?? 'Torneo desconocido'}
                          </p>
                          <p className="text-xs text-[#9b99a6]">
                            {zone.category?.name ?? '—'} · Zona {zone.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Deudas ─────────────────────────────────────────────────── */}
        <TabsContent value="deudas">
          <div className="max-w-2xl space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Saldo pendiente', value: '—', accent: false },
                { label: 'Total pagado', value: '—', accent: false },
                { label: 'Última actividad', value: '—', accent: false },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-[#e8e6e1] bg-white p-4">
                  <p className="text-xs text-[#9b99a6]">{stat.label}</p>
                  <p className="mt-1 text-lg font-semibold text-[#0f0e13]">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* History */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#0f0e13]">Historial de pagos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="py-10 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f6f4]">
                    <Receipt className="h-5 w-5 text-[#c4c2cc]" />
                  </div>
                  <p className="text-sm font-medium text-[#6b6a72]">Sin movimientos registrados</p>
                  <p className="mt-1 text-xs text-[#c4c2cc]">
                    {/* TODO: conectar con API de balance del equipo */}
                    El historial de pagos aparecerá acá cuando esté disponible.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Partidos ───────────────────────────────────────────────── */}
        <TabsContent value="partidos">
          <div className="max-w-3xl space-y-4">
            <div className="rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f7f6f4]">
                <CalendarDays className="h-5 w-5 text-[#c4c2cc]" />
              </div>
              <p className="text-sm font-medium text-[#6b6a72]">Sin partidos próximos</p>
              <p className="mt-1 text-xs text-[#c4c2cc]">
                {/* TODO: conectar con API de partidos filtrados por equipo */}
                Los partidos de este equipo aparecerán acá.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
