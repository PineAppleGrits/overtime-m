import { AdminTableSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function EmpleadosLoading() {
  return (
    <AdminTableSkeleton
      title="Empleados"
      description="Gestiona árbitros, fotógrafos y agentes de mesa"
      showSearch
      columns={6}
      rows={5}
    />
  )
}
