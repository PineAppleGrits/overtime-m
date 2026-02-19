'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import employeeService from '@/modules/admin/services/EmployeeService'
import { Employee, EmployeeRole } from '@/modules/admin/types'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2, Search, Loader2, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Create/Edit dialog
  const [dialog, setDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'arbitro' as EmployeeRole,
  })
  const [saving, setSaving] = useState(false)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, limit: 10 }
      if (roleFilter !== 'all') params.role = roleFilter
      const response = await employeeService.getEmployees(params as never)
      setEmployees(response.data?.data ?? response.data ?? [])
      setTotalPages(response.data?.meta?.totalPages ?? 1)
    } catch {
      toast.error('Error al cargar empleados')
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleSave = async () => {
    if (!form.firstName || !form.lastName) {
      toast.error('Nombre y apellido son obligatorios')
      return
    }
    setSaving(true)
    try {
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          role: form.role,
        })
        toast.success('Empleado actualizado')
      } else {
        await employeeService.createEmployee({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email || undefined,
          phone: form.phone || undefined,
          role: form.role,
        })
        toast.success('Empleado creado')
      }
      closeDialog()
      fetchEmployees()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (emp: Employee) => {
    try {
      await employeeService.updateEmployee(emp.id, { isActive: !emp.isActive })
      toast.success(emp.isActive ? 'Empleado desactivado' : 'Empleado activado')
      fetchEmployees()
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await employeeService.deleteEmployee(deleteId)
      toast.success('Empleado eliminado')
      fetchEmployees()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp)
    setForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email ?? '',
      phone: emp.phone ?? '',
      role: emp.role,
    })
    setDialog(true)
  }

  const closeDialog = () => {
    setDialog(false)
    setEditingEmployee(null)
    setForm({ firstName: '', lastName: '', email: '', phone: '', role: 'arbitro' })
  }

  const filteredEmployees = employees.filter((e) =>
    search
      ? `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase())
      : true
  )

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      label: 'Nombre',
      render: (e) => (
        <div>
          <p className="font-medium">{e.firstName} {e.lastName}</p>
          {e.email && <p className="text-xs text-muted-foreground">{e.email}</p>}
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rol',
      render: (e) => <StatusBadge status={e.role} type="employee" />,
    },
    {
      key: 'phone',
      label: 'Teléfono',
      render: (e) => <span className="text-sm">{e.phone ?? '-'}</span>,
    },
    {
      key: 'isActive',
      label: 'Estado',
      render: (e) =>
        e.isActive ? (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Activo</Badge>
        ) : (
          <Badge variant="outline">Inactivo</Badge>
        ),
    },
    {
      key: 'assignedMatches',
      label: 'Partidos',
      render: (e) => (
        <span className="text-sm">{e.assignedMatches?.length ?? 0} asignados</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10',
      render: (e) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(e)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/empleados/${e.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver partidos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleActive(e)}>
              {e.isActive ? 'Desactivar' : 'Activar'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(e.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Empleados"
        description="Gestiona árbitros, fotógrafos y agentes de mesa"
        onCreateClick={() => setDialog(true)}
        createLabel="Nuevo empleado"
      />

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empleados..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="arbitro">Árbitros</SelectItem>
            <SelectItem value="fotografo">Fotógrafos</SelectItem>
            <SelectItem value="agente_mesa">Agentes de mesa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredEmployees}
        loading={loading}
        emptyMessage="No hay empleados registrados"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rol *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as EmployeeRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="arbitro">Árbitro</SelectItem>
                  <SelectItem value="fotografo">Fotógrafo</SelectItem>
                  <SelectItem value="agente_mesa">Agente de mesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEmployee ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar empleado"
        description="¿Estás seguro de eliminar este empleado?"
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
