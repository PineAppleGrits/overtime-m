function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />
}

export default function NewTournamentLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonLine className="h-4 w-24" />
        <SkeletonLine className="h-8 w-48" />
        <SkeletonLine className="h-4 w-96" />
      </div>
      <div className="max-w-2xl space-y-4">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <SkeletonLine className="h-6 w-48" />
          <SkeletonLine className="h-10 w-full" />
          <SkeletonLine className="h-20 w-full" />
          <SkeletonLine className="h-10 w-full" />
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <SkeletonLine className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonLine className="h-10 w-full" />
            <SkeletonLine className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
