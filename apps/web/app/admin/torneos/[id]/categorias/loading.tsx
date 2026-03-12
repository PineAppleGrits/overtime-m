import { AdminTableSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function CategoriesLoading() {
  return <AdminTableSkeleton columns={2} rows={3} showSearch={false} />
}
