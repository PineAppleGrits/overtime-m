'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { StatusBadge } from '@/modules/admin/components/StatusBadge'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Search, Eye, AlertCircle, Loader2 } from 'lucide-react'
import employeeBrowserService from '@/modules/admin/services/EmployeeService'
import { Employee, EmployeeRole } from '@/modules/admin/types'
import { createEmployeeAction, updateEmployeeAction, toggleEmployeeActiveAction, deleteEmployeeAction } from '@/modules/admin/actions/employeeActions'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import { useDebouncedValue } from '@/modules/admin/hooks/useDebouncedValue'

const EMP_KEY = ['admin', 'employees'] as const

interface EmpleadosContentProps {
  initialData: { data: Employee[]; meta: { total: number; page: number; limit: number; totalPages: number }; error: string | null }
}

export function EmpleadosContent({ initialData }: EmpleadosContentProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [roleFilter, setRoleFilter] = useState('all')
  const [dialog, setDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'arbitro' as EmployeeRole })

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: EMP_KEY }), [qc])

  const { data, isPending, isError } = useQuery({
    queryKey: [...EMP_KEY, page, roleFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: 10 }
      if (roleFilter !== 'all') params.role = roleFilter
      const response = await employeeBrowserService.getEmployees(params as never)
      const raw = response.data ?? response
      return { data: (raw.data ?? raw ?? []) as Employee[], meta: raw.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 } }
    },
    initialData: page === 1 && roleFilter === 'all' && !initialData.error ? { data: initialData.data, meta: initialData.meta } : undefined,
    placeholderData: (prev) => prev,
  })

  const employees = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1
  const filtered = debouncedSearch ? employees.filter((e) => `${e.firstName} ${e.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase())) : employees

  const closeDialog = useCallback(() => { setDialog(false); setEditingEmployee(null); setForm({ firstName: '', lastName: '', email: '', phone: '', role: 'arbitro' }) }, [])

  const createAction = useServerAction(createEmployeeAction, { successMessage: 'Empleado creado', onSuccess: () => { invalidate(); closeDialog() } })
  const updateAction = useServerAction(updateEmployeeAction, { successMessage: 'Empleado actualizado', onSuccess: () => { invalidate(); closeDialog() } })
  const toggleAction = useServerAction(toggleEmployeeActiveAction, { onSuccess: invalidate })
  const deleteAction = useServerAction(deleteEmployeeAction, { successMessage: 'Empleado eliminado', onSuccess: () => { invalidate(); setDeleteId(null) } })

  const handleSave = () => {
    const dto = { firstName: form.firstName, lastName: form.lastName, email: form.email || undefined, phone: form.phone || undefined, role: form.role }
    if (editingEmployee) updateAction.execute({ id: editingEmployee.id, ...dto })
    else createAction.execute(dto)
  }

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp)
    setForm({ firstName: emp.firstName, lastName: emp.lastName, email: emp.email ?? '', phone: emp.phone ?? '', role: emp.role })
    setDialog(true)
  }

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title="Empleados" description="Gestiona árbitros, fotógrafos y agentes de mesa" />
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar los empleados</p>
          <Button variant="outline" size="sm" onClick={() => invalidate()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const columns: Column<Employee>[] = [
    { key: 'name', label: 'Nombre', render: (e) => (<div><p className="font-medium">{e.firstName} {e.lastName}</p>{e.email && <p className="text-xs text-muted-foreground">{e.email}</p>}</div>) },
    { key: 'role', label: 'Rol', render: (e) => <StatusBadge status={e.role} type="employee" /> },
    { key: 'phone', label: 'Teléfono', render: (e) => <span className="text-sm">{e.phone ?? '-'}</span> },
    { key: 'isActive', label: 'Estado', render: (e) => e.isActive ? <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Activo</Badge> : <Badge variant="outline">Inactivo</Badge> },
    { key: 'assignedMatches', label: 'Partidos', render: (e) => <span className="text-sm">{e.assignedMatches?.length ?? 0} asignados</span> },
    {
      key: 'actions', label: '', className: 'w-10',
      render: (e) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(e)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/empleados/${e.id}`)}><Eye className="mr-2 h-4 w-4" />Ver partidos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleAction.execute({ id: e.id, isActive: !e.isActive })}>{e.isActive ? 'Desactivar' : 'Activar'}</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(e.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Empleados" description="Gestiona árbitros, fotógrafos y agentes de mesa" onCreateClick={() => setDialog(true)} createLabel="Nuevo empleado" />
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar empleados..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Rol" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="arbitro">Árbitros</SelectItem><SelectItem value="fotografo">Fotógrafos</SelectItem><SelectItem value="agente_mesa">Agentes de mesa</SelectItem></SelectContent></Select>
      </div>
      <DataTable columns={columns} data={filtered} loading={isPending} emptyMessage="No hay empleados registrados" page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingEmployee ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nombre *</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Apellido *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Rol *</Label><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as EmployeeRole })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="arbitro">Árbitro</SelectItem><SelectItem value="fotografo">Fotógrafo</SelectItem><SelectItem value="agente_mesa">Agente de mesa</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createAction.isPending || updateAction.isPending}>{(createAction.isPending || updateAction.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingEmployee ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} title="Eliminar empleado" description="¿Estás seguro de eliminar este empleado?" variant="destructive" confirmLabel="Eliminar" onConfirm={() => deleteId && deleteAction.execute({ id: deleteId })} loading={deleteAction.isPending} />
    </div>
  )
}
