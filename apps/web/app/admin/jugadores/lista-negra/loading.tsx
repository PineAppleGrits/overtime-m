import { AdminTableSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function BlacklistLoading() {
  return (
    <AdminTableSkeleton
      title="Lista Negra"
      description="Personas que no pueden participar"
      showSearch
      columns={5}
      rows={5}
    />
  )
}
