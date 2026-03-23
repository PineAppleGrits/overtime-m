import { UserListContent } from '@/modules/admin/components/usuarios/UserListContent'
import userService from '@/modules/user/UserService'

// TODO - Pedirle a GIno qeu lo haga paginado
const getEmployees = async () => {
  try {
    const data = await userService.getUsers({ page: 1, limit: 10, role: 'photographer' })
    // `response` is { data: AdminUser[], meta: {...} } — extract the array
    return {
      data,
      meta: {
        totalPages: 1, // TODO - Calcular esto con base en la respuesta real
        total: data.length, // TODO - Esto también debería venir del backend
        page: 1,
        limit: 10,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: [],
      meta: {
        totalPages: 1,
        total: 0,
        page: 1,
        limit: 10,
      },
      error: error as Error,
    }
  }
}

export default async function FotografosPage() {
  const initialData = await getEmployees()

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
