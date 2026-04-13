'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { AlertCircle, Archive, DraftingCompass, Loader2, Plus, Send, Trash2 } from 'lucide-react'
import adminTournamentBrowserService from '@/modules/admin/services/AdminTournamentService'
import { updateTournamentAction, changeStatusAction, closeRegistrationsAction, createPricingAction, deletePricingAction } from '@/modules/admin/actions/tournamentActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { AdminTournament, TournamentPricing, TournamentStatus, PaymentMethod } from '@/modules/admin/types'

interface Sport { id: string; name: string; code: string }

interface EditTournamentContentProps {
  tournamentId: string
  initialData: { data: AdminTournament | null; error: string | null }
  sports: Sport[]
}

export function EditTournamentContent({ tournamentId, initialData, sports }: EditTournamentContentProps) {
  const qc = useQueryClient()
  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['admin', 'tournament', tournamentId] }), [qc, tournamentId])

  const { data: tournament, isPending, isError, refetch } = useQuery({
    queryKey: ['admin', 'tournament', tournamentId],
    queryFn: async () => {
      const response = await adminTournamentBrowserService.getTournamentById(tournamentId)
      return (response.data ?? response) as AdminTournament
    },
    initialData: !initialData.error && initialData.data ? initialData.data : undefined,
  })

  const [form, setForm] = useState({
    name: initialData.data?.name ?? '',
    description: initialData.data?.description ?? '',
    sportId: initialData.data?.sportId ?? '',
    startDate: initialData.data?.startDate?.split('T')[0] ?? '',
    endDate: initialData.data?.endDate?.split('T')[0] ?? '',
    registrationStartDate: initialData.data?.registrationStartDate?.split('T')[0] ?? '',
    registrationEndDate: initialData.data?.registrationEndDate?.split('T')[0] ?? '',
    registrationOpen: initialData.data?.registrationOpen ?? false,
  })

  const [pricingDialog, setPricingDialog] = useState(false)
  const [pricingForm, setPricingForm] = useState({
    paymentMethod: 'transferencia' as PaymentMethod,
    amount: '', dateFrom: '', dateTo: '',
  })

  const updateAction = useServerAction(updateTournamentAction, { successMessage: 'Torneo actualizado', onSuccess: invalidate })
  const changeStatusAct = useServerAction(changeStatusAction, { successMessage: 'Estado actualizado', onSuccess: invalidate })
  const closeRegAct = useServerAction(closeRegistrationsAction, { successMessage: 'Inscripciones cerradas', onSuccess: invalidate })
  const createPricingAct = useServerAction(createPricingAction, {
    successMessage: 'Precio agregado',
    onSuccess: () => { invalidate(); setPricingDialog(false); setPricingForm({ paymentMethod: 'transferencia', amount: '', dateFrom: '', dateTo: '' }) },
  })
  const deletePricingAct = useServerAction(deletePricingAction, { successMessage: 'Precio eliminado', onSuccess: invalidate })

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Torneo" description="Edita el torneo" backHref="/admin/torneos" />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar el torneo</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  if (isPending || !tournament) {
    return (
      <div>
        <PageHeader title="Torneo" description="Cargando..." backHref="/admin/torneos" />
        <div className="animate-pulse space-y-4"><div className="h-6 w-48 rounded bg-muted" /><div className="h-64 rounded bg-muted" /></div>
      </div>
    )
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateAction.execute({
      id: tournamentId,
      name: form.name,
      description: form.description || undefined,
      sportId: form.sportId,
      startDate: form.startDate,
      endDate: form.endDate,
      registrationStartDate: form.registrationStartDate || undefined,
      registrationEndDate: form.registrationEndDate || undefined,
      registrationOpen: form.registrationOpen,
    })
  }

  const pricing: TournamentPricing[] = tournament.pricing ?? []

  return (
    <div>
      <PageHeader
        title={tournament.name}
        description="Edita la información del torneo, precios y configuración de inscripciones"
        backHref="/admin/torneos"
        actions={
          <div className="flex gap-2">
            {tournament.status === 'draft' && (
              <Button variant="outline" onClick={() => changeStatusAct.execute({ id: tournamentId, status: 'published' })}>
                <Send className="mr-2 h-4 w-4" />Publicar
              </Button>
            )}
            {tournament.status === 'published' && (
              <>
                <Button variant="outline" onClick={() => closeRegAct.execute({ id: tournamentId })}>Cerrar inscripciones web</Button>
                <Button variant="outline" onClick={() => changeStatusAct.execute({ id: tournamentId, status: 'archived' })}>
                  <Archive className="mr-2 h-4 w-4" />Archivar
                </Button>
              </>
            )}
            {tournament.status === 'archived' && (
              <Button variant="outline" onClick={() => changeStatusAct.execute({ id: tournamentId, status: 'draft' })}>
                <DraftingCompass className="mr-2 h-4 w-4" />Volver a borrador
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={tournament.status} type="tournament" />
        <span className="text-sm text-muted-foreground">Inscripciones: {form.registrationOpen ? 'Abiertas' : 'Cerradas'}</span>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Precios de inscripción</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSave} className="max-w-2xl space-y-6">
            <Card>
              <CardHeader><CardTitle>Información general</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="name">Nombre</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="description">Descripción</Label><Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Disciplina</Label>
                  <Select value={form.sportId} onValueChange={(v) => setForm({ ...form, sportId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{sports.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Fechas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Fecha inicio</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Fecha fin</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Inicio inscripciones</Label><Input type="date" value={form.registrationStartDate} onChange={(e) => setForm({ ...form, registrationStartDate: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Cierre inscripciones</Label><Input type="date" value={form.registrationEndDate} onChange={(e) => setForm({ ...form, registrationEndDate: e.target.value })} /></div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div><Label>Inscripciones abiertas (web)</Label><p className="text-xs text-muted-foreground">Permite inscripciones desde la página</p></div>
                  <Switch checked={form.registrationOpen} onCheckedChange={(checked) => setForm({ ...form, registrationOpen: checked })} />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="submit" disabled={updateAction.isPending}>
                {updateAction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href={`/admin/torneos/${tournamentId}/categorias`}>Gestionar categorías</a>
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href={`/admin/torneos/${tournamentId}/inscripciones`}>Ver inscripciones</a>
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href={`/admin/torneos/${tournamentId}/partidos`}>Organizar partidos</a>
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
                  <CardDescription>Configura diferentes precios por rango de fecha y método de pago.</CardDescription>
                </div>
                <Dialog open={pricingDialog} onOpenChange={setPricingDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="mr-2 h-4 w-4" />Agregar precio</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Agregar precio</DialogTitle><DialogDescription>Define un precio para un rango de fechas y método de pago</DialogDescription></DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Método de pago</Label>
                        <Select value={pricingForm.paymentMethod} onValueChange={(v) => setPricingForm({ ...pricingForm, paymentMethod: v as PaymentMethod })}>
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
                        <Input type="number" placeholder="0.00" value={pricingForm.amount} onChange={(e) => setPricingForm({ ...pricingForm, amount: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Desde</Label><Input type="date" value={pricingForm.dateFrom} onChange={(e) => setPricingForm({ ...pricingForm, dateFrom: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Hasta</Label><Input type="date" value={pricingForm.dateTo} onChange={(e) => setPricingForm({ ...pricingForm, dateTo: e.target.value })} /></div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPricingDialog(false)}>Cancelar</Button>
                      <Button onClick={() => createPricingAct.execute({ tournamentId, paymentMethod: pricingForm.paymentMethod, amount: parseFloat(pricingForm.amount), dateFrom: pricingForm.dateFrom, dateTo: pricingForm.dateTo })} disabled={createPricingAct.isPending}>
                        {createPricingAct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Agregar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {pricing.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No hay precios configurados</p>
                ) : (
                  <div className="space-y-3">
                    {pricing.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">${p.amount.toLocaleString('es-AR')} - {p.paymentMethod === 'transferencia' ? 'Transferencia' : p.paymentMethod === 'efectivo' ? 'Efectivo' : 'Método configurado'}</p>
                          <p className="text-sm text-muted-foreground">{new Date(p.dateFrom).toLocaleDateString('es-AR')} - {new Date(p.dateTo).toLocaleDateString('es-AR')}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deletePricingAct.execute({ tournamentId, pricingId: p.id })}>
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
