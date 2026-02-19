'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import adminTournamentService from '@/modules/admin/services/AdminTournamentService'
import teamService from '@/modules/admin/services/browser/teamService'
import categoryService from '@/modules/admin/services/browser/categoryService'
import { AdminRegistration, PaymentMethod } from '@/modules/admin/types'
import { toast } from 'sonner'
import { MoreHorizontal, Check, X, CreditCard, Plus, Loader2 } from 'lucide-react'

interface TeamOption {
  id: string
  name: string
}

interface CategoryOption {
  id: string
  name: string
}

export default function RegistrationsPage() {
  const params = useParams()
  const tournamentId = params.id as string

  const [registrations, setRegistrations] = useState<AdminRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')

  // Manual registration
  const [manualDialog, setManualDialog] = useState(false)
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [manualForm, setManualForm] = useState({
    teamId: '',
    categoryId: '',
    paymentMethod: 'efectivo' as PaymentMethod,
    paymentAmount: '',
  })
  const [savingManual, setSavingManual] = useState(false)

  // Reject dialog
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchRegistrations = useCallback(async () => {
    setLoading(true)
    try {
      const paramObj: Record<string, unknown> = { page, limit: 10 }
      if (statusFilter !== 'all') paramObj.status = statusFilter
      const response = await adminTournamentService.getRegistrations(tournamentId, paramObj as never)
      setRegistrations(response.data?.data ?? response.data ?? [])
      setTotalPages(response.data?.meta?.totalPages ?? 1)
    } catch {
      toast.error('Error al cargar inscripciones')
    } finally {
      setLoading(false)
    }
  }, [tournamentId, page, statusFilter])

  useEffect(() => {
    fetchRegistrations()
  }, [fetchRegistrations])

  const fetchTeamsAndCategories = async () => {
    try {
      const [teamsRes, catsRes] = await Promise.all([
        teamService.getTeams({ limit: 100 }),
        categoryService.getCategories(tournamentId),
      ])
      setTeams(teamsRes.data?.data ?? teamsRes.data ?? [])
      setCategories(catsRes.data ?? catsRes ?? [])
    } catch {
      toast.error('Error al cargar equipos y categorías')
    }
  }

  const handleApprove = async (regId: string) => {
    try {
      await adminTournamentService.approveRegistration(tournamentId, regId)
      toast.success('Inscripción aprobada')
      fetchRegistrations()
    } catch {
      toast.error('Error al aprobar')
    }
  }

  const handleReject = async () => {
    if (!rejectId) return
    try {
      await adminTournamentService.rejectRegistration(tournamentId, rejectId, rejectReason)
      toast.success('Inscripción rechazada')
      setRejectId(null)
      setRejectReason('')
      fetchRegistrations()
    } catch {
      toast.error('Error al rechazar')
    }
  }

  const handleConfirmPayment = async (regId: string) => {
    try {
      await adminTournamentService.confirmPayment(tournamentId, regId)
      toast.success('Pago confirmado')
      fetchRegistrations()
    } catch {
      toast.error('Error al confirmar pago')
    }
  }

  const handleManualRegistration = async () => {
    if (!manualForm.teamId || !manualForm.categoryId) {
      toast.error('Selecciona equipo y categoría')
      return
    }
    setSavingManual(true)
    try {
      await adminTournamentService.manualRegistration(tournamentId, {
        teamId: manualForm.teamId,
        categoryId: manualForm.categoryId,
        paymentMethod: manualForm.paymentMethod,
        paymentAmount: manualForm.paymentAmount ? parseFloat(manualForm.paymentAmount) : undefined,
        autoApprove: true,
      })
      toast.success('Inscripción manual registrada y aprobada')
      setManualDialog(false)
      setManualForm({ teamId: '', categoryId: '', paymentMethod: 'efectivo', paymentAmount: '' })
      fetchRegistrations()
    } catch {
      toast.error('Error al registrar inscripción manual')
    } finally {
      setSavingManual(false)
    }
  }

  const columns: Column<AdminRegistration>[] = [
    {
      key: 'teamName',
      label: 'Equipo',
      render: (r) => <span className="font-medium">{r.teamName}</span>,
    },
    { key: 'categoryName', label: 'Categoría' },
    {
      key: 'status',
      label: 'Estado',
      render: (r) => <StatusBadge status={r.status} type="registration" />,
    },
    {
      key: 'paymentStatus',
      label: 'Pago',
      render: (r) => <StatusBadge status={r.paymentStatus} type="payment" />,
    },
    {
      key: 'paymentMethod',
      label: 'Método',
      render: (r) => (
        <span className="text-sm capitalize">{r.paymentMethod ?? '-'}</span>
      ),
    },
    {
      key: 'isManual',
      label: 'Tipo',
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.isManual ? 'Manual' : 'Web'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      render: (r) => (
        <span className="text-sm">
          {new Date(r.createdAt).toLocaleDateString('es-AR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10',
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {r.status === 'pending' && (
              <>
                <DropdownMenuItem onClick={() => handleApprove(r.id)}>
                  <Check className="mr-2 h-4 w-4" />
                  Aprobar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRejectId(r.id)}>
                  <X className="mr-2 h-4 w-4" />
                  Rechazar
                </DropdownMenuItem>
              </>
            )}
            {r.paymentStatus === 'pending' && (
              <DropdownMenuItem onClick={() => handleConfirmPayment(r.id)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Confirmar pago
              </DropdownMenuItem>
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
        onCreateClick={() => {
          fetchTeamsAndCategories()
          setManualDialog(true)
        }}
        createLabel="Inscripción manual"
      />

      <div className="mb-4 flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="approved">Aprobadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={registrations}
        loading={loading}
        emptyMessage="No hay inscripciones"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Manual Registration Dialog */}
      <Dialog open={manualDialog} onOpenChange={setManualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inscripción manual</DialogTitle>
          </DialogHeader>
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardDescription>
                Registra un equipo manualmente. Se aprueba automáticamente y se emite el pago de inscripción.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-0">
              <div className="space-y-2">
                <Label>Equipo *</Label>
                <Select value={manualForm.teamId} onValueChange={(v) => setManualForm({ ...manualForm, teamId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={manualForm.categoryId} onValueChange={(v) => setManualForm({ ...manualForm, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
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
                <Input
                  type="number"
                  placeholder="0.00"
                  value={manualForm.paymentAmount}
                  onChange={(e) => setManualForm({ ...manualForm, paymentAmount: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialog(false)}>Cancelar</Button>
            <Button onClick={handleManualRegistration} disabled={savingManual}>
              {savingManual && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar e inscribir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar inscripción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Motivo del rechazo..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject}>Rechazar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
