import { AdminDetailSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function NewTeamLoading() {
  return (
    <AdminDetailSkeleton
      title="Nuevo equipo"
      description="Completá los datos del equipo"
      cards={1}
    />
  )
}
