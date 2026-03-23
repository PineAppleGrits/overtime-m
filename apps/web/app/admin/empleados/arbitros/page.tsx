import { UserListContent } from '@/modules/admin/components/usuarios/UserListContent'
import userService from '@/modules/user/UserService'

// TODO - Pedirle a GIno qeu lo haga paginado
const getEmployees = async () => {
  try {
    const data = await userService.getUsers({ page: 1, limit: 10, role: 'referee' })
    // `response` is { data: AdminUser[], meta: {...} } — extract the array
    return {
      ...data,
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

export default async function ArbitrosPage() {
  const initialData = await getEmployees()


  return (
    <UserListContent
      initialData={initialData}
      title="Árbitros"
      description="Gestiona los árbitros registrados en la plataforma"
      createLabel="Nuevo árbitro"
      queryKeyPrefix="arbitros"
      fixedRole="referee"
    />
  )
}
