import { SkeletonLine } from '@/modules/admin/components/AdminTableSkeleton'

export default function EmployeeDetailLoading() {
  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <div className="flex items-start gap-3">
        <SkeletonLine className="mt-1 h-9 w-9 rounded-md" />
        <div className="space-y-2">
          <SkeletonLine className="h-8 w-64" />
          <SkeletonLine className="h-4 w-80" />
        </div>
      </div>
      {/* Badges */}
      <div className="flex gap-3">
        <SkeletonLine className="h-6 w-20 rounded-full" />
        <SkeletonLine className="h-6 w-16 rounded-full" />
        <SkeletonLine className="h-4 w-40" />
      </div>
      {/* Tabs + cards */}
      <div>
        <SkeletonLine className="mb-4 h-10 w-64 rounded-md" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-[#e8e6e1] bg-white p-4 space-y-2">
              <SkeletonLine className="h-5 w-56" />
              <div className="flex gap-4">
                <SkeletonLine className="h-4 w-24" />
                <SkeletonLine className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
