import { AdminTableSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function InscripcionesLoading() {
  return (
    <AdminTableSkeleton
      title="Inscripciones"
      description="Todas las inscripciones de todos los torneos"
      columns={6}
      rows={5}
    />
  )
}
