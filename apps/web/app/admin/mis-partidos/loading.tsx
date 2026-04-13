import { SkeletonLine } from '@/modules/admin/components/AdminTableSkeleton'

export default function MisPartidosLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonLine className="h-8 w-48" />
        <SkeletonLine className="h-4 w-80" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <SkeletonLine className="h-9 w-32 rounded-md" />
        <SkeletonLine className="h-9 w-36 rounded-md" />
        <SkeletonLine className="h-9 w-36 rounded-md" />
      </div>

      {/* Match cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[#e8e6e1] bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <SkeletonLine className="h-5 w-56" />
              <SkeletonLine className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex gap-4">
              <SkeletonLine className="h-4 w-24" />
              <SkeletonLine className="h-4 w-16" />
              <SkeletonLine className="h-4 w-32" />
            </div>
            <SkeletonLine className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
