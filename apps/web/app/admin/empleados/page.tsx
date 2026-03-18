import userService from '@/modules/user/UserService'
import { UserListContent } from '@/modules/admin/components/usuarios/UserListContent'
import { AdminUser } from '@/modules/admin/types'

const EMPLOYEE_ROLES = 'referee,photographer,official'

export default async function EmpleadosPage() {
  let initialData: {
    data: AdminUser[]
    meta: { total: number; page: number; limit: number; totalPages: number }
    error: string | null
  } = {
    data: [],
    meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    error: null,
  }

  try {
    const response = await userService.getUsers({ page: 1, limit: 10, role: EMPLOYEE_ROLES })
    const raw = response.data ?? response
    initialData.data = raw.data ?? raw ?? []
    initialData.meta = raw.meta ?? initialData.meta
  } catch {
    initialData.error = 'Error al cargar empleados'
  }

  return (
    <UserListContent
      initialData={initialData}
      title="Empleados"
      description="Gestiona árbitros, fotógrafos y oficiales de mesa"
      createLabel="Nuevo empleado"
      queryKeyPrefix="empleados"
      filterableRoles={['referee', 'photographer', 'official']}
    />
  )
}
