import { UsuariosContent } from '@/modules/admin/components/usuarios/UsuariosContent'
import userService from '@/modules/user/UserService'


// TODO - Pedirle a GIno qeu lo haga paginado
const getUsers = async () => {
  try {
    const data = await userService.getUsers({ page: 1, limit: 10 })
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

export default async function UsuariosPage() {
  const initialData = await getUsers()

  return <UsuariosContent initialData={initialData} />
}
