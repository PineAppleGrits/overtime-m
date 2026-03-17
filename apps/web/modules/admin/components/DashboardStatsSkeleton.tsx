export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#e8e6e1] bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-2.5 w-20 rounded-full bg-[#f0ede8] animate-pulse" />
              <div className="h-8 w-14 rounded-lg bg-[#f0ede8] animate-pulse" />
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#f0ede8] animate-pulse shrink-0" />
          </div>
        </div>
      ))}
    </div>
  )
}
