import { AdminTableSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function CanchasLoading() {
  return (
    <AdminTableSkeleton
      title="Canchas"
      description="Gestiona las canchas y lugares donde se juegan los partidos"
      rows={5}
      columns={6}
      showSearch
    />
  )
}
