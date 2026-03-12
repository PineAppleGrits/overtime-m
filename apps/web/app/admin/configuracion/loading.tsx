function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />
}

export default function ConfiguracionLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonLine className="h-8 w-64" />
        <SkeletonLine className="h-4 w-96" />
      </div>
      <SkeletonLine className="h-10 w-80 rounded-md" />
      <div className="max-w-2xl rounded-lg border bg-card p-6 space-y-4">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="h-4 w-72" />
        <SkeletonLine className="h-10 w-full" />
        <SkeletonLine className="h-20 w-full" />
        <SkeletonLine className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <SkeletonLine className="h-10 w-full" />
          <SkeletonLine className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
