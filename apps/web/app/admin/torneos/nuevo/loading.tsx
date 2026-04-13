import { AdminDetailSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function NewTournamentLoading() {
  return (
    <AdminDetailSkeleton
      title="Nuevo torneo"
      description="Completá los datos para crear un nuevo torneo"
      cards={2}
    />
  )
}
