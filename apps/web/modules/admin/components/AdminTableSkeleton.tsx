function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />
}

interface AdminTableSkeletonProps {
  /** Number of table rows to render */
  rows?: number
  /** Number of columns to render */
  columns?: number
  /** Show search bar skeleton */
  showSearch?: boolean
  /** Show header with title */
  title?: string
  description?: string
}

export function AdminTableSkeleton({
  rows = 5,
  columns = 4,
  showSearch = false,
  title,
  description,
}: AdminTableSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* PageHeader skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          {title ? (
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          ) : (
            <SkeletonLine className="h-8 w-48" />
          )}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : (
            <SkeletonLine className="h-4 w-80" />
          )}
        </div>
        <SkeletonLine className="h-10 w-36 rounded-md" />
      </div>

      {/* Search skeleton */}
      {showSearch && (
        <div className="mb-4">
          <SkeletonLine className="h-10 w-72 rounded-md" />
        </div>
      )}

      {/* Table skeleton */}
      <div className="rounded-lg border border-[#e8e6e1] bg-white">
        {/* Table header */}
        <div className="flex gap-4 border-b px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonLine key={i} className="h-4 flex-1" />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b px-4 py-4 last:border-b-0">
            {Array.from({ length: columns }).map((_, j) => (
              <SkeletonLine
                key={j}
                className={`h-4 flex-1 ${j === 0 ? 'max-w-[200px]' : 'max-w-[120px]'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
