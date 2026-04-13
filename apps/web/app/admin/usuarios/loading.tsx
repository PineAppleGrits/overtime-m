import { AdminTableSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function UsuariosLoading() {
  return (
    <AdminTableSkeleton
      title="Usuarios"
      description="Gestiona los usuarios de la plataforma"
      rows={5}
      columns={5}
      showSearch
    />
  )
}
