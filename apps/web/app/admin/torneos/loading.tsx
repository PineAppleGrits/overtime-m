import { AdminTableSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function TorneosLoading() {
  return (
    <AdminTableSkeleton
      title="Torneos"
      description="Gestiona todos los torneos de la plataforma"
      rows={5}
      columns={7}
      showSearch
    />
  )
}
