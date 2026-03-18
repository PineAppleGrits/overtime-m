import userService from '@/modules/user/UserService'
import { UserListContent } from '@/modules/admin/components/usuarios/UserListContent'
import { AdminUser } from '@/modules/admin/types'

export default async function OficialesPage() {
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
    const response = await userService.getUsers({ page: 1, limit: 10, role: 'official' })
    const raw = response.data ?? response
    initialData.data = raw.data ?? raw ?? []
    initialData.meta = raw.meta ?? initialData.meta
  } catch {
    initialData.error = 'Error al cargar oficiales de mesa'
  }

  return (
    <UserListContent
      initialData={initialData}
      title="Oficiales de mesa"
      description="Gestiona los oficiales de mesa registrados en la plataforma"
      createLabel="Nuevo oficial"
      queryKeyPrefix="oficiales"
      fixedRole="official"
    />
  )
}
