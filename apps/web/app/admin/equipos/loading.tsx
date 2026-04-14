import { AdminTableSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function EquiposLoading() {
  return (
    <AdminTableSkeleton
      title="Equipos"
      description="Gestiona los equipos"
      showSearch
      columns={5}
      rows={5}
    />
  )
}
