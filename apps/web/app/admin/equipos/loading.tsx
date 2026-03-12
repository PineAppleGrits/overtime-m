import { AdminTableSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function EquiposLoading() {
  return (
    <AdminTableSkeleton
      title="Equipos"
      description="Gestiona los equipos"
      showSearch
      columns={6}
      rows={5}
    />
  )
}
