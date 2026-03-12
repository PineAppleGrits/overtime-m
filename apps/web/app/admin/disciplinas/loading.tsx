import { AdminTableSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function DisciplinasLoading() {
  return (
    <AdminTableSkeleton
      title="Disciplinas"
      description="Gestiona los deportes disponibles en la plataforma"
      rows={4}
      columns={3}
    />
  )
}
