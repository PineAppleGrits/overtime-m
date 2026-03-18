import userService from '@/modules/user/UserService'
import { UsuariosContent } from '@/modules/admin/components/usuarios/UsuariosContent'
import { AdminUser } from '@/modules/admin/types'

export default async function UsuariosPage() {
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
    const response = await userService.getUsers({ page: 1, limit: 10 })
    const raw = response.data ?? response
    initialData.data = raw.data ?? raw ?? []
    initialData.meta = raw.meta ?? initialData.meta
  } catch {
    initialData.error = 'Error al cargar usuarios'
  }

  return <UsuariosContent initialData={initialData} />
}
