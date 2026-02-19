'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import adminTournamentService from '@/modules/admin/services/AdminTournamentService'
import sportService from '@/modules/admin/services/browser/sportService'
import { AdminTournament, TournamentPricing, TournamentStatus, PaymentMethod } from '@/modules/admin/types'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Send, Archive, DraftingCompass } from 'lucide-react'

interface Sport {
  id: string
  name: string
  code: string
}

export default function EditTournamentPage() {
  const router = useRouter()
  const params = useParams()
  const tournamentId = params.id as string

  const [tournament, setTournament] = useState<AdminTournament | null>(null)
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    sportId: '',
    startDate: '',
    endDate: '',
    registrationStartDate: '',
    registrationEndDate: '',
    registrationOpen: false,
  })

  // Pricing state
  const [pricing, setPricing] = useState<TournamentPricing[]>([])
  const [pricingDialog, setPricingDialog] = useState(false)
  const [pricingForm, setPricingForm] = useState({
    paymentMethod: 'transferencia' as PaymentMethod,
    amount: '',
    dateFrom: '',
    dateTo: '',
  })
  const [savingPricing, setSavingPricing] = useState(false)

  const fetchTournament = useCallback(async () => {
    try {
      const response = await adminTournamentService.getTournamentById(tournamentId)
      const data = response.data ?? response
      setTournament(data)
      setForm({
        name: data.name ?? '',
        description: data.description ?? '',
        sportId: data.sportId ?? '',
        startDate: data.startDate?.split('T')[0] ?? '',
        endDate: data.endDate?.split('T')[0] ?? '',
        registrationStartDate: data.registrationStartDate?.split('T')[0] ?? '',
        registrationEndDate: data.registrationEndDate?.split('T')[0] ?? '',
        registrationOpen: data.registrationOpen ?? false,
      })
      setPricing(data.pricing ?? [])
    } catch {
      toast.error('Error al cargar el torneo')
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    fetchTournament()
    const fetchSports = async () => {
      try {
        const response = await sportService.getSports()
        setSports(response.data ?? response ?? [])
      } catch {
        /* ignored */
      }
    }
    fetchSports()
  }, [fetchTournament])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminTournamentService.updateTournament(tournamentId, {
        name: form.name,
        description: form.description || undefined,
        sportId: form.sportId,
        startDate: form.startDate,
        endDate: form.endDate,
        registrationStartDate: form.registrationStartDate || undefined,
        registrationEndDate: form.registrationEndDate || undefined,
        registrationOpen: form.registrationOpen,
      })
      toast.success('Torneo actualizado')
      fetchTournament()
    } catch {
      toast.error('Error al actualizar el torneo')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (status: TournamentStatus) => {
    try {
      await adminTournamentService.changeStatus(tournamentId, status)
      toast.success('Estado actualizado')
      fetchTournament()
    } catch {
      toast.error('Error al cambiar el estado')
    }
  }

  const handleCloseRegistrations = async () => {
    try {
      await adminTournamentService.closeRegistrations(tournamentId)
      toast.success('Inscripciones cerradas. Solo se pueden hacer inscripciones manuales.')
      fetchTournament()
    } catch {
      toast.error('Error al cerrar inscripciones')
    }
  }

  const handleAddPricing = async () => {
    if (!pricingForm.amount || !pricingForm.dateFrom || !pricingForm.dateTo) {
      toast.error('Completa todos los campos de precio')
      return
    }
    setSavingPricing(true)
    try {
      await adminTournamentService.createPricing(tournamentId, {
        paymentMethod: pricingForm.paymentMethod,
        amount: parseFloat(pricingForm.amount),
        dateFrom: pricingForm.dateFrom,
        dateTo: pricingForm.dateTo,
      })
      toast.success('Precio agregado')
      setPricingDialog(false)
      setPricingForm({ paymentMethod: 'transferencia', amount: '', dateFrom: '', dateTo: '' })
      fetchTournament()
    } catch {
      toast.error('Error al agregar precio')
    } finally {
      setSavingPricing(false)
    }
  }

  const handleDeletePricing = async (pricingId: string) => {
    try {
      await adminTournamentService.deletePricing(tournamentId, pricingId)
      toast.success('Precio eliminado')
      fetchTournament()
    } catch {
      toast.error('Error al eliminar precio')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!tournament) {
    return <div className="py-12 text-center text-muted-foreground">Torneo no encontrado</div>
  }

  return (
    <div>
      <PageHeader
        title={tournament.name}
        description="Edita la información del torneo, precios y configuración de inscripciones"
        backHref="/admin/torneos"
        actions={
          <div className="flex gap-2">
            {tournament.status === 'draft' && (
              <Button variant="outline" onClick={() => handleStatusChange('published')}>
                <Send className="mr-2 h-4 w-4" />
                Publicar
              </Button>
            )}
            {tournament.status === 'published' && (
              <>
                <Button variant="outline" onClick={handleCloseRegistrations}>
                  Cerrar inscripciones web
                </Button>
                <Button variant="outline" onClick={() => handleStatusChange('archived')}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archivar
                </Button>
              </>
            )}
            {tournament.status === 'archived' && (
              <Button variant="outline" onClick={() => handleStatusChange('draft')}>
                <DraftingCompass className="mr-2 h-4 w-4" />
                Volver a borrador
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={tournament.status} type="tournament" />
        <span className="text-sm text-muted-foreground">
          Inscripciones: {form.registrationOpen ? 'Abiertas' : 'Cerradas'}
        </span>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Precios de inscripción</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSave} className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información general</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Disciplina</Label>
                  <Select value={form.sportId} onValueChange={(v) => setForm({ ...form, sportId: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sports.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fechas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha inicio</Label>
                    <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha fin</Label>
                    <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Inicio inscripciones</Label>
                    <Input type="date" value={form.registrationStartDate} onChange={(e) => setForm({ ...form, registrationStartDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cierre inscripciones</Label>
                    <Input type="date" value={form.registrationEndDate} onChange={(e) => setForm({ ...form, registrationEndDate: e.target.value })} />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Inscripciones abiertas (web)</Label>
                    <p className="text-xs text-muted-foreground">Permite inscripciones desde la página</p>
                  </div>
                  <Switch
                    checked={form.registrationOpen}
                    onCheckedChange={(checked) => setForm({ ...form, registrationOpen: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href={`/admin/torneos/${tournamentId}/categorias`}>Gestionar categorías</a>
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href={`/admin/torneos/${tournamentId}/inscripciones`}>Ver inscripciones</a>
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="pricing">
          <div className="max-w-2xl space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Precios de inscripción</CardTitle>
                  <CardDescription>
                    Configura diferentes precios por rango de fecha y método de pago.
                    Se aplica el precio vigente según la fecha de inscripción.
                  </CardDescription>
                </div>
                <Dialog open={pricingDialog} onOpenChange={setPricingDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar precio
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar precio</DialogTitle>
                      <DialogDescription>
                        Define un precio para un rango de fechas y método de pago
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Método de pago</Label>
                        <Select
                          value={pricingForm.paymentMethod}
                          onValueChange={(v) => setPricingForm({ ...pricingForm, paymentMethod: v as PaymentMethod })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="configurado">Método configurado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Monto ($)</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={pricingForm.amount}
                          onChange={(e) => setPricingForm({ ...pricingForm, amount: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Desde</Label>
                          <Input
                            type="date"
                            value={pricingForm.dateFrom}
                            onChange={(e) => setPricingForm({ ...pricingForm, dateFrom: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hasta</Label>
                          <Input
                            type="date"
                            value={pricingForm.dateTo}
                            onChange={(e) => setPricingForm({ ...pricingForm, dateTo: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPricingDialog(false)}>Cancelar</Button>
                      <Button onClick={handleAddPricing} disabled={savingPricing}>
                        {savingPricing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Agregar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {pricing.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No hay precios configurados
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pricing.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">
                            ${p.amount.toLocaleString('es-AR')} - {p.paymentMethod === 'transferencia' ? 'Transferencia' : p.paymentMethod === 'efectivo' ? 'Efectivo' : 'Método configurado'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(p.dateFrom).toLocaleDateString('es-AR')} - {new Date(p.dateTo).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePricing(p.id)}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
