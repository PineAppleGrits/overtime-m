export function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />
}

// ─── Skeleton for detail / form pages ────────────────────────────────────────

interface AdminDetailSkeletonProps {
  /** Show back arrow placeholder */
  showBack?: boolean
  /** Static title (avoids flicker) */
  title?: string
  description?: string
  /** Number of card sections to render */
  cards?: number
}

export function AdminDetailSkeleton({
  showBack = true,
  title,
  description,
  cards = 2,
}: AdminDetailSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* PageHeader skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {showBack && <SkeletonLine className="mt-1 size-9 rounded-md" />}
          <div className="space-y-2">
            {title ? (
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            ) : (
              <SkeletonLine className="h-8 w-48" />
            )}
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : (
              <SkeletonLine className="h-4 w-80" />
            )}
          </div>
        </div>
        <SkeletonLine className="h-9 w-28 rounded-md" />
      </div>

      {/* Card sections */}
      <div className="max-w-2xl space-y-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-lg border border-[#e8e6e1] bg-white p-6 space-y-4">
            <SkeletonLine className="h-6 w-48" />
            <SkeletonLine className="h-4 w-72" />
            <SkeletonLine className="h-10 w-full" />
            {i === 0 && <SkeletonLine className="h-20 w-full" />}
            <div className="grid grid-cols-2 gap-4">
              <SkeletonLine className="h-10 w-full" />
              <SkeletonLine className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
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
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
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
