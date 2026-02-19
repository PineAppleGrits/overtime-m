import { Card, CardContent } from '@/components/ui/card'

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} />
}

export default function MisPartidosLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <SkeletonLine className="h-8 w-48" />
        <SkeletonLine className="h-4 w-80" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <SkeletonLine className="h-9 w-32 rounded-md" />
        <SkeletonLine className="h-9 w-36 rounded-md" />
        <SkeletonLine className="h-9 w-36 rounded-md" />
      </div>

      {/* Match cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-4">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
