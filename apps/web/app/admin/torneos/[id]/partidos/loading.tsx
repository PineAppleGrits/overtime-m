export default function MatchSchedulerLoading() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-24 rounded bg-[#e8e6e1] animate-pulse" />
        <div className="h-8 w-48 rounded bg-[#e8e6e1] animate-pulse" />
        <div className="h-4 w-64 rounded bg-[#e8e6e1] animate-pulse" />
      </div>

      {/* Selectors skeleton */}
      <div className="flex gap-3">
        <div className="space-y-1">
          <div className="h-3 w-12 rounded bg-[#e8e6e1] animate-pulse" />
          <div className="h-9 w-[160px] rounded-lg bg-[#e8e6e1] animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-12 rounded bg-[#e8e6e1] animate-pulse" />
          <div className="h-9 w-[220px] rounded-lg bg-[#e8e6e1] animate-pulse" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 240px)' }}>
        {/* Left sidebar */}
        <div className="w-[280px] shrink-0 rounded-xl border border-[#e8e6e1] bg-white p-3 space-y-2">
          <div className="h-4 w-32 rounded bg-[#e8e6e1] animate-pulse mb-3" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-[#e8e6e1]/50 animate-pulse" />
          ))}
        </div>

        {/* Right grid */}
        <div className="flex-1 rounded-xl border border-[#e8e6e1] bg-white overflow-hidden">
          <div className="h-10 bg-[#f7f6f4] border-b border-[#e8e6e1]" />
          <div className="grid grid-cols-2 divide-x divide-[#e8e6e1]">
            {[0, 1].map(col => (
              <div key={col} className="space-y-0">
                <div className="h-8 bg-[#fafaf8] border-b border-[#e8e6e1]" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 border-b border-[#f0eeeb] px-3 py-2 flex items-center gap-3">
                    <div className="w-16 h-4 rounded bg-[#e8e6e1] animate-pulse" />
                    <div className="flex-1 h-10 rounded-lg bg-[#e8e6e1]/30 animate-pulse" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
