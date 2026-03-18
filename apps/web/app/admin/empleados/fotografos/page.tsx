import userService from '@/modules/user/UserService'
import { UserListContent } from '@/modules/admin/components/usuarios/UserListContent'
import { AdminUser } from '@/modules/admin/types'

export default async function FotografosPage() {
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
    const response = await userService.getUsers({ page: 1, limit: 10, role: 'photographer' })
    const raw = response.data ?? response
    initialData.data = raw.data ?? raw ?? []
    initialData.meta = raw.meta ?? initialData.meta
  } catch {
    initialData.error = 'Error al cargar fotógrafos'
  }

  return (
    <UserListContent
      initialData={initialData}
      title="Fotógrafos"
      description="Gestiona los fotógrafos registrados en la plataforma"
      createLabel="Nuevo fotógrafo"
      queryKeyPrefix="fotografos"
      fixedRole="photographer"
    />
  )
}
