'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertCircle, Check, MoreHorizontal, X } from 'lucide-react'
import adminTournamentBrowserService from '@/modules/admin/services/AdminTournamentService'
import { approveRegistrationTournamentAction, rejectRegistrationTournamentAction } from '@/modules/admin/actions/tournamentActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { AdminRegistration } from '@/modules/admin/types'

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

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['admin', 'tournament-registrations', tournamentId] }), [qc, tournamentId])

  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'tournament-registrations', tournamentId, page, statusFilter],
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

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Inscripciones" description="" backHref={`/admin/torneos/${tournamentId}`} />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
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
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Inscripciones"
        description="Gestiona las inscripciones del torneo. Aprueba o rechaza solicitudes."
        backHref={`/admin/torneos/${tournamentId}`}
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
