import { AdminTableSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function EditTournamentLoading() {
  return <AdminTableSkeleton columns={2} rows={4} showSearch={false} />
}
