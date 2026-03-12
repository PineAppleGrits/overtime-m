function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />
}

export default function EmployeeDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonLine className="h-4 w-24" />
        <SkeletonLine className="h-8 w-64" />
        <SkeletonLine className="h-4 w-80" />
      </div>
      <div className="flex gap-3">
        <SkeletonLine className="h-6 w-20 rounded-full" />
        <SkeletonLine className="h-6 w-16 rounded-full" />
        <SkeletonLine className="h-4 w-40" />
      </div>
      <div>
        <SkeletonLine className="mb-4 h-10 w-64 rounded-md" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLine key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
