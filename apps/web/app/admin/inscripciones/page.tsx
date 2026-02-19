'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import registrationService from '@/modules/admin/services/browser/registrationService'
import { toast } from 'sonner'
import { MoreHorizontal, Check, X, CreditCard } from 'lucide-react'

interface RegistrationRow {
  id: string
  teamId: string
  teamName?: string
  tournamentId: string
  tournamentName?: string
  categoryId: string
  categoryName?: string
  status: string
  paymentStatus?: string
  createdAt: string
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchRegistrations = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, limit: 10 }
      if (statusFilter !== 'all') params.status = statusFilter
      const response = await registrationService.getRegistrations(params as never)
      setRegistrations(response.data?.data ?? response.data ?? [])
      setTotalPages(response.data?.meta?.totalPages ?? 1)
    } catch {
      toast.error('Error al cargar inscripciones')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchRegistrations()
  }, [fetchRegistrations])

  const handleApprove = async (id: string) => {
    try {
      await registrationService.approveRegistration(id)
      toast.success('Inscripción aprobada')
      fetchRegistrations()
    } catch {
      toast.error('Error al aprobar')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await registrationService.rejectRegistration(id)
      toast.success('Inscripción rechazada')
      fetchRegistrations()
    } catch {
      toast.error('Error al rechazar')
    }
  }

  const columns: Column<RegistrationRow>[] = [
    {
      key: 'teamName',
      label: 'Equipo',
      render: (r) => <span className="font-medium">{r.teamName ?? r.teamId}</span>,
    },
    {
      key: 'tournamentName',
      label: 'Torneo',
      render: (r) => <span className="text-sm">{r.tournamentName ?? r.tournamentId}</span>,
    },
    {
      key: 'categoryName',
      label: 'Categoría',
      render: (r) => <span className="text-sm">{r.categoryName ?? '-'}</span>,
    },
    {
      key: 'status',
      label: 'Estado',
      render: (r) => <StatusBadge status={r.status} type="registration" />,
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
                <DropdownMenuItem onClick={() => handleReject(r.id)}>
                  <X className="mr-2 h-4 w-4" />
                  Rechazar
                </DropdownMenuItem>
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
        description="Todas las inscripciones de todos los torneos"
      />

      <div className="mb-4">
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
    </div>
  )
}
