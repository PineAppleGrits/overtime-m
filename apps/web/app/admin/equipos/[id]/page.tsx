'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import teamService from '@/modules/admin/services/browser/teamService'
import playerService from '@/modules/admin/services/browser/playerService'
import sportService from '@/modules/admin/services/browser/sportService'
import { toast } from 'sonner'
import { Loader2, Trash2, Plus, UserPlus } from 'lucide-react'

interface Sport {
  id: string
  name: string
}

interface PlayerRow {
  id: string
  firstName: string
  lastName: string
  jerseyNumber?: number
  position?: string
  photoUrl?: string
}

interface TeamData {
  id: string
  name: string
  slug: string
  logoUrl?: string
  sportId: string
  captainId?: string
  players?: PlayerRow[]
}

export default function EditTeamPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const teamId = params.id as string
  const defaultTab = searchParams.get('tab') || 'general'

  const [team, setTeam] = useState<TeamData | null>(null)
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    sportId: '',
  })

  // Players
  const [allPlayers, setAllPlayers] = useState<PlayerRow[]>([])
  const [playerDialog, setPlayerDialog] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [addingPlayer, setAddingPlayer] = useState(false)

  const fetchTeam = useCallback(async () => {
    try {
      const response = await teamService.getTeamById(teamId)
      const data = response.data ?? response
      setTeam(data)
      setForm({
        name: data.name ?? '',
        logoUrl: data.logoUrl ?? '',
        sportId: data.sportId ?? '',
      })
    } catch {
      toast.error('Error al cargar el equipo')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  useEffect(() => {
    fetchTeam()
    const fetchSports = async () => {
      try {
        const response = await sportService.getSports()
        setSports(response.data ?? response ?? [])
      } catch { /* ignored */ }
    }
    fetchSports()
  }, [fetchTeam])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await teamService.updateTeam(teamId, {
        name: form.name,
        logoUrl: form.logoUrl || undefined,
        sportId: form.sportId,
      })
      toast.success('Equipo actualizado')
      fetchTeam()
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleAddPlayer = async () => {
    if (!selectedPlayerId) {
      toast.error('Selecciona un jugador')
      return
    }
    setAddingPlayer(true)
    try {
      await teamService.addPlayer(teamId, { playerId: selectedPlayerId })
      toast.success('Jugador agregado')
      setPlayerDialog(false)
      setSelectedPlayerId('')
      fetchTeam()
    } catch {
      toast.error('Error al agregar jugador')
    } finally {
      setAddingPlayer(false)
    }
  }

  const handleRemovePlayer = async (playerId: string) => {
    try {
      await teamService.removePlayer(teamId, playerId)
      toast.success('Jugador removido')
      fetchTeam()
    } catch {
      toast.error('Error al remover jugador')
    }
  }

  const fetchAllPlayers = async () => {
    try {
      const response = await playerService.getPlayers({ limit: 100 })
      setAllPlayers(response.data?.data ?? response.data ?? [])
    } catch { /* ignored */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!team) {
    return <div className="py-12 text-center text-muted-foreground">Equipo no encontrado</div>
  }

  return (
    <div>
      <PageHeader
        title={team.name}
        description="Edita la información del equipo y gestiona sus jugadores"
        backHref="/admin/equipos"
      />

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="players">Jugadores ({team.players?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSave} className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del equipo</CardTitle>
              </CardHeader>
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
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="players">
          <div className="max-w-2xl space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  fetchAllPlayers()
                  setPlayerDialog(true)
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Agregar jugador
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {!team.players || team.players.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No hay jugadores en este equipo
                  </p>
                ) : (
                  <div className="divide-y">
                    {team.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={player.photoUrl} />
                            <AvatarFallback className="text-xs">
                              {player.firstName?.charAt(0)}{player.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {player.position ?? 'Sin posición'} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePlayer(player.id)}
                        >
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
              <DialogHeader>
                <DialogTitle>Agregar jugador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Jugador</Label>
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar jugador" /></SelectTrigger>
                    <SelectContent>
                      {allPlayers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPlayerDialog(false)}>Cancelar</Button>
                <Button onClick={handleAddPlayer} disabled={addingPlayer}>
                  {addingPlayer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Agregar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
