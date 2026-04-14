import { AdminTableSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function JugadoresLoading() {
  return <AdminTableSkeleton title="Jugadores" description="Gestiona todos los jugadores registrados en la plataforma" rows={5} columns={5} showSearch />
}
