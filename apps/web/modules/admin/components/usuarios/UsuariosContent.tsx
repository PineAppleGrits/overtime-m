'use client'

import { AdminUser } from '@/modules/admin/types'
import { UserListContent } from './UserListContent'

interface UsuariosContentProps {
  initialData: {
    data: AdminUser[]
    meta: { total: number; page: number; limit: number; totalPages: number }
    error: Error | null
  }
}

export function UsuariosContent({ initialData }: UsuariosContentProps) {
  return (
    <UserListContent
      initialData={initialData}
      title="Usuarios"
      description="Gestiona todos los perfiles de usuario"
      createLabel="Nuevo usuario"
      queryKeyPrefix="users"
    />
  )
}
