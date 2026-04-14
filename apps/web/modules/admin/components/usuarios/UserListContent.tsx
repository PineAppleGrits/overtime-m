'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createUserAction, deleteUserAction, updateUserAction } from '@/modules/admin/actions/userActions'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Column, DataTable } from '@/modules/admin/components/DataTable'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { useDebouncedValue } from '@/modules/admin/hooks/useDebouncedValue'
import { useServerAction } from '@/modules/admin/hooks/useServerAction'
import userBrowserService from '@/modules/admin/services/UserService'
import { AdminUser, ProfileRole } from '@/modules/admin/types'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Loader2, MoreHorizontal, Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'

export const ROLE_LABELS: Record<ProfileRole, string> = {
  master: 'Master',
  admin: 'Admin',
  player: 'Jugador',
  photographer: 'Fotógrafo',
  referee: 'Árbitro',
  official: 'Oficial de mesa',
}

const ROLE_COLORS: Record<ProfileRole, string> = {
  master: 'border-purple-200 bg-purple-50 text-purple-700',
  admin: 'border-blue-200 bg-blue-50 text-blue-700',
  player: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  photographer: 'border-amber-200 bg-amber-50 text-amber-700',
  referee: 'border-orange-200 bg-orange-50 text-orange-700',
  official: 'border-slate-200 bg-slate-50 text-slate-700',
}

const ALL_ROLES: ProfileRole[] = ['master', 'admin', 'player', 'photographer', 'referee', 'official']

export interface UserListContentProps {
  initialData: {
    data: AdminUser[]
    meta: { total: number; page: number; limit: number; totalPages: number }
    error: Error | null
  }
  title: string
  description: string
  createLabel: string
  /** Unique key prefix for React Query — avoids cache collisions between pages */
  queryKeyPrefix: string
  /**
   * Lock this page to a single role: API always filters by it, form hides the role field.
   * Role column is also hidden since all rows share the same role.
   */
  fixedRole?: ProfileRole
  /**
   * Roles available in the filter dropdown and in the create/edit form.
   * Ignored when fixedRole is set.
   * Defaults to all roles when omitted.
   */
  filterableRoles?: ProfileRole[]
}

const emptyForm = (defaultRole: ProfileRole | '') => ({
  name: '',
  email: '',
  phone: '',
  documentNumber: '',
  dateOfBirth: '',
  role: defaultRole,
})

export function UserListContent({
  initialData,
  title,
  description,
  createLabel,
  queryKeyPrefix,
  fixedRole,
  filterableRoles,
}: UserListContentProps) {
  const qc = useQueryClient()
  const queryKey = ['admin', queryKeyPrefix] as const

  const availableRoles = fixedRole ? undefined : (filterableRoles ?? ALL_ROLES)
  const defaultRole: ProfileRole | '' = fixedRole ?? availableRoles?.[0] ?? ''

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [roleFilter, setRoleFilter] = useState('all')
  const [dialog, setDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm(defaultRole))

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey }), [qc, queryKey])

  // Build the API role param:
  // - fixedRole → always use that single role
  // - filterableRoles + filter selected → use selected role
  // - filterableRoles + 'all' selected → send all filterable roles as comma-separated
  const apiRole = fixedRole
    ? fixedRole
    : roleFilter !== 'all'
      ? roleFilter
      : availableRoles && availableRoles.length < ALL_ROLES.length
        ? availableRoles.join(',')
        : undefined

  const { data, isPending, isError } = useQuery({
    queryKey: [...queryKey, page, debouncedSearch, roleFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: 10 }
      if (debouncedSearch) params.search = debouncedSearch
      if (apiRole) params.role = apiRole
      const response = await userBrowserService.getUsers(params as never)
      const raw = response.data ?? response
      return {
        data: (raw.data ?? raw ?? []) as AdminUser[],
        meta: raw.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 },
      }
    },
    initialData:
      page === 1 && !debouncedSearch && roleFilter === 'all' && !initialData.error
        ? { data: initialData.data, meta: initialData.meta }
        : undefined,
    placeholderData: (prev) => prev,
  })

  const users = data?.data ?? []
  const total = data?.meta?.total
  const totalPages = data?.meta?.totalPages ?? 1

  const closeDialog = useCallback(() => {
    setDialog(false)
    setEditingUser(null)
    setForm(emptyForm(defaultRole))
  }, [defaultRole])

  const createAction = useServerAction(createUserAction, {
    successMessage: `${title.replace(/s$/, '')} creado`,
    onSuccess: () => { invalidate(); closeDialog() },
  })
  const updateAction = useServerAction(updateUserAction, {
    successMessage: `${title.replace(/s$/, '')} actualizado`,
    onSuccess: () => { invalidate(); closeDialog() },
  })
  const deleteAction = useServerAction(deleteUserAction, {
    successMessage: `${title.replace(/s$/, '')} eliminado`,
    onSuccess: () => { invalidate(); setDeleteId(null) },
  })

  const handleSave = () => {
    const dto = {
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      documentNumber: form.documentNumber || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      role: (fixedRole ?? form.role) || undefined,
    }
    if (editingUser) updateAction.execute({ id: editingUser.id, ...dto })
    else createAction.execute(dto)
  }

  const openEdit = (user: AdminUser) => {
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email ?? '',
      phone: user.phone ?? '',
      documentNumber: user.documentNumber ?? '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
      role: user.role,
    })
    setDialog(true)
  }

  if (initialData.error && isError) {
    return (
      <div>
        <PageHeader title={title} description={description} />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-[#e8e6e1] bg-white py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-muted-foreground">Error al cargar los datos</p>
          <Button variant="outline" size="sm" onClick={() => invalidate()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      label: 'Nombre',
      render: (u) => (
        <div>
          <p className="font-medium">{u.name}</p>
          {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
        </div>
      ),
    },
    // Only show role column when it can vary (no fixedRole)
    ...(!fixedRole
      ? [{
        key: 'role' as const,
        label: 'Rol',
        render: (u: AdminUser) => (
          <Badge variant="outline" className={ROLE_COLORS[u.role]}>
            {ROLE_LABELS[u.role] ?? u.role}
          </Badge>
        ),
      }]
      : []),
    {
      key: 'documentNumber',
      label: 'Documento',
      render: (u) => <span className="text-sm">{u.documentNumber ?? '-'}</span>,
    },
    {
      key: 'phone',
      label: 'Teléfono',
      render: (u) => <span className="text-sm">{u.phone ?? '-'}</span>,
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10',
      render: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(u)}>
              <Pencil className="mr-2 h-4 w-4" />Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(u.id)}>
              <Trash2 className="mr-2 h-4 w-4" />Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        onCreateClick={() => setDialog(true)}
        createLabel={createLabel}
      />

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o documento..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
            aria-label="Buscar usuarios"
          />
        </div>

        {/* Role filter — only shown when there are multiple roles to choose from */}
        {!fixedRole && availableRoles && availableRoles.length > 1 && (
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[200px]" aria-label="Filtrar por rol"><SelectValue placeholder="Rol" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {availableRoles.map((r) => (
                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={isPending}
        emptyMessage={`No hay ${title.toLowerCase()} registrados`}
        page={page}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? `Editar ${title.replace(/s$/, '').toLowerCase()}` : createLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nombre completo *</Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Juan Pérez"
              />
            </div>

            {/* Role selector — hidden when role is fixed */}
            {!fixedRole && availableRoles && (
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={form.role || availableRoles[0]}
                  onValueChange={(v) => setForm({ ...form, role: v as ProfileRole })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-phone">Teléfono</Label>
                <Input
                  id="user-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-documentNumber">Nro. documento</Label>
                <Input
                  id="user-documentNumber"
                  value={form.documentNumber}
                  onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-dateOfBirth">Fecha de nacimiento</Label>
                <Input
                  id="user-dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={createAction.isPending || updateAction.isPending}
            >
              {(createAction.isPending || updateAction.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingUser ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={`Eliminar ${title.replace(/s$/, '').toLowerCase()}`}
        description="¿Estás seguro? Esta acción no se puede deshacer."
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={() => deleteId && deleteAction.execute({ id: deleteId })}
        loading={deleteAction.isPending}
      />
    </div>
  )
}
