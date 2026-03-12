'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertCircle, Check, CreditCard, Loader2, MoreHorizontal, Plus, X } from 'lucide-react'
import adminTournamentBrowserService from '@/modules/admin/services/AdminTournamentService'
import teamBrowserService from '@/modules/admin/services/browser/teamService'
import categoryBrowserService from '@/modules/admin/services/browser/categoryService'
import { approveRegistrationTournamentAction, rejectRegistrationTournamentAction, confirmPaymentAction, manualRegistrationAction } from '@/modules/admin/actions/tournamentActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { AdminRegistration, PaymentMethod } from '@/modules/admin/types'

interface TournamentRegistrationsContentProps {
  tournamentId: string
  initialData: { data: AdminRegistration[]; meta: { totalPages: number }; error: string | null }
}

export function TournamentRegistrationsContent({ tournamentId, initialData }: TournamentRegistrationsContentProps) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [manualDialog, setManualDialog] = useState(false)
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [cats, setCats] = useState<{ id: string; name: string }[]>([])
  const [manualForm, setManualForm] = useState({ teamId: '', categoryId: '', paymentMethod: 'efectivo' as PaymentMethod, paymentAmount: '' })

  const QUERY_KEY = ['admin', 'tournament-registrations', tournamentId, page, statusFilter] as const
  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['admin', 'tournament-registrations', tournamentId] }), [qc, tournamentId])

  const { data, isPending, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: 10 }
      if (statusFilter !== 'all') params.status = statusFilter
      const response = await adminTournamentBrowserService.getRegistrations(tournamentId, params as never)
      const raw = response.data ?? response
      return { data: (raw.data ?? raw ?? []) as AdminRegistration[], meta: raw.meta ?? { totalPages: 1 } }
    },
    initialData: page === 1 && statusFilter === 'all' && !initialData.error ? { data: initialData.data, meta: initialData.meta } : undefined,
    placeholderData: (prev) => prev,
  })

  const approveAct = useServerAction(approveRegistrationTournamentAction, { successMessage: 'Inscripción aprobada', onSuccess: invalidate })
  const rejectAct = useServerAction(rejectRegistrationTournamentAction, {
    successMessage: 'Inscripción rechazada',
    onSuccess: () => { invalidate(); setRejectId(null); setRejectReason('') },
  })
  const confirmPayAct = useServerAction(confirmPaymentAction, { successMessage: 'Pago confirmado', onSuccess: invalidate })
  const manualAct = useServerAction(manualRegistrationAction, {
    successMessage: 'Inscripción manual registrada y aprobada',
    onSuccess: () => { invalidate(); setManualDialog(false); setManualForm({ teamId: '', categoryId: '', paymentMethod: 'efectivo', paymentAmount: '' }) },
  })

  const fetchTeamsAndCats = async () => {
    try {
      const [teamsRes, catsRes] = await Promise.all([
        teamBrowserService.getTeams({ limit: 100 }),
        categoryBrowserService.getCategories(tournamentId),
      ])
      setTeams(teamsRes.data?.data ?? teamsRes.data ?? [])
      setCats(catsRes.data ?? catsRes ?? [])
    } catch { /* ignored */ }
  }

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Inscripciones" description="" backHref={`/admin/torneos/${tournamentId}`} />
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar las inscripciones</p>
          <Button variant="outline" size="sm" onClick={() => invalidate()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const registrations = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1

  const columns: Column<AdminRegistration>[] = [
    { key: 'teamName', label: 'Equipo', render: (r) => <span className="font-medium">{r.teamName}</span> },
    { key: 'categoryName', label: 'Categoría' },
    { key: 'status', label: 'Estado', render: (r) => <StatusBadge status={r.status} type="registration" /> },
    { key: 'paymentStatus', label: 'Pago', render: (r) => <StatusBadge status={r.paymentStatus} type="payment" /> },
    { key: 'paymentMethod', label: 'Método', render: (r) => <span className="text-sm capitalize">{r.paymentMethod ?? '-'}</span> },
    { key: 'isManual', label: 'Tipo', render: (r) => <span className="text-xs text-muted-foreground">{r.isManual ? 'Manual' : 'Web'}</span> },
    { key: 'createdAt', label: 'Fecha', render: (r) => <span className="text-sm">{new Date(r.createdAt).toLocaleDateString('es-AR')}</span> },
    {
      key: 'actions', label: '', className: 'w-10',
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {r.status === 'pending' && (
              <>
                <DropdownMenuItem onClick={() => approveAct.execute({ tournamentId, registrationId: r.id })}><Check className="mr-2 h-4 w-4" />Aprobar</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRejectId(r.id)}><X className="mr-2 h-4 w-4" />Rechazar</DropdownMenuItem>
              </>
            )}
            {r.paymentStatus === 'pending' && (
              <DropdownMenuItem onClick={() => confirmPayAct.execute({ tournamentId, registrationId: r.id })}><CreditCard className="mr-2 h-4 w-4" />Confirmar pago</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Inscripciones"
        description="Gestiona las inscripciones del torneo. Aprueba, rechaza o registra inscripciones manuales."
        backHref={`/admin/torneos/${tournamentId}`}
        onCreateClick={() => { fetchTeamsAndCats(); setManualDialog(true) }}
        createLabel="Inscripción manual"
      />

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="approved">Aprobadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={registrations} loading={isPending} emptyMessage="No hay inscripciones" page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Manual Registration Dialog */}
      <Dialog open={manualDialog} onOpenChange={setManualDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Inscripción manual</DialogTitle></DialogHeader>
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0"><CardDescription>Registra un equipo manualmente. Se aprueba automáticamente y se emite el pago de inscripción.</CardDescription></CardHeader>
            <CardContent className="space-y-4 px-0">
              <div className="space-y-2">
                <Label>Equipo *</Label>
                <Select value={manualForm.teamId} onValueChange={(v) => setManualForm({ ...manualForm, teamId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                  <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={manualForm.categoryId} onValueChange={(v) => setManualForm({ ...manualForm, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                  <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={manualForm.paymentMethod} onValueChange={(v) => setManualForm({ ...manualForm, paymentMethod: v as PaymentMethod })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="configurado">Método configurado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monto ($)</Label>
                <Input type="number" placeholder="0.00" value={manualForm.paymentAmount} onChange={(e) => setManualForm({ ...manualForm, paymentAmount: e.target.value })} />
              </div>
            </CardContent>
          </Card>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialog(false)}>Cancelar</Button>
            <Button onClick={() => manualAct.execute({ tournamentId, teamId: manualForm.teamId, categoryId: manualForm.categoryId, paymentMethod: manualForm.paymentMethod, paymentAmount: manualForm.paymentAmount ? parseFloat(manualForm.paymentAmount) : undefined, autoApprove: true })} disabled={manualAct.isPending}>
              {manualAct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar e inscribir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rechazar inscripción</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Motivo (opcional)</Label><Input placeholder="Motivo del rechazo..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => rejectId && rejectAct.execute({ tournamentId, registrationId: rejectId, rejectionReason: rejectReason || undefined })}>Rechazar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
