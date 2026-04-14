'use client'

import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Check, X, AlertCircle, Info } from 'lucide-react'
import registrationBrowserService from '@/modules/admin/services/browser/registrationService'
import { approveRegistrationAction, rejectRegistrationAction } from '@/modules/admin/actions/registrationActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'

const REG_KEY = ['admin', 'registrations'] as const

interface RegistrationRow {
  id: string; teamId: string; teamName?: string; tournamentId: string; tournamentName?: string; categoryId: string; categoryName?: string; status: string; paymentStatus?: string; createdAt: string
}

interface InscripcionesContentProps {
  initialData: { data: RegistrationRow[]; meta: { total: number; page: number; limit: number; totalPages: number }; error: string | null }
}

export function InscripcionesContent({ initialData }: InscripcionesContentProps) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: REG_KEY }), [qc])

  const { data, isPending, isError } = useQuery({
    queryKey: [...REG_KEY, page, statusFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: 10 }
      if (statusFilter !== 'all') params.status = statusFilter
      const response = await registrationBrowserService.getRegistrations(params as never)
      const raw = response.data ?? response
      return { data: (raw.data ?? raw ?? []) as RegistrationRow[], meta: raw.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 } }
    },
    initialData: page === 1 && statusFilter === 'all' && !initialData.error ? { data: initialData.data, meta: initialData.meta } : undefined,
    placeholderData: (prev) => prev,
  })

  const registrations = data?.data ?? []
  const total = data?.meta?.total
  const totalPages = data?.meta?.totalPages ?? 1

  const approveAction = useServerAction(approveRegistrationAction, { successMessage: 'Inscripción aprobada', onSuccess: invalidate })
  const rejectAction = useServerAction(rejectRegistrationAction, { successMessage: 'Inscripción rechazada', onSuccess: invalidate })

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Inscripciones" description="Todas las inscripciones de todos los torneos" />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" /><p className="text-muted-foreground">Error al cargar las inscripciones</p>
          <Button variant="outline" size="sm" onClick={() => invalidate()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const columns: Column<RegistrationRow>[] = [
    { key: 'teamName', label: 'Equipo', render: (r) => <span className="font-medium">{r.teamName ?? r.teamId}</span> },
    { key: 'tournamentName', label: 'Torneo', render: (r) => <span className="text-sm">{r.tournamentName ?? r.tournamentId}</span> },
    { key: 'categoryName', label: 'Categoría', render: (r) => <span className="text-sm">{r.categoryName ?? '-'}</span> },
    { key: 'status', label: 'Estado', render: (r) => <StatusBadge status={r.status} type="registration" /> },
    { key: 'createdAt', label: 'Fecha', render: (r) => <span className="text-sm">{new Date(r.createdAt).toLocaleDateString('es-AR')}</span> },
    {
      key: 'actions', label: '', className: 'w-10',
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {r.status === 'pending' && (<><DropdownMenuItem onClick={() => approveAction.execute({ id: r.id })}><Check className="mr-2 h-4 w-4" />Aprobar</DropdownMenuItem><DropdownMenuItem onClick={() => rejectAction.execute({ id: r.id })}><X className="mr-2 h-4 w-4" />Rechazar</DropdownMenuItem></>)}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Inscripciones" description="Todas las inscripciones de todos los torneos" />
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
        <Info className="h-4 w-4 text-blue-500 shrink-0" />
        <p className="text-sm text-blue-700">Las inscripciones pasan por un proceso de revision. Cuando un equipo se inscribe, el estado es &quot;Pendiente&quot;. Podes aprobar o rechazar cada solicitud desde el menu de acciones.</p>
      </div>
      <div className="mb-4"><Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}><SelectTrigger className="w-[180px]" aria-label="Filtrar por estado"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="pending">Pendientes</SelectItem><SelectItem value="approved">Aprobadas</SelectItem><SelectItem value="rejected">Rechazadas</SelectItem></SelectContent></Select></div>
      <DataTable columns={columns} data={registrations} loading={isPending} emptyMessage="No hay inscripciones" page={page} total={total} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
