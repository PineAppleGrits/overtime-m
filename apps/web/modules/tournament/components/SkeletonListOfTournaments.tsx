export function SkeletonListOfTournaments() {
  return (
    <div
      role="status"
      aria-label="Cargando torneos"
      className="flex flex-col gap-4"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-sm animate-pulse"
          style={{
            background:
              i % 2 === 0
                ? 'linear-gradient(135deg, #2a2548 0%, #181525 100%)'
                : 'linear-gradient(135deg, #1f1b33 0%, #181525 100%)',
          }}
        >
          {/* Left accent line */}
          <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#3b336a]" />

          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0 pl-2">
              {/* Title */}
              <div className="h-5 w-2/5 rounded-sm bg-white/8" />

              {/* Description */}
              <div className="mt-2.5 space-y-1.5">
                <div className="h-3.5 w-full rounded-sm bg-white/5" />
                <div className="h-3.5 w-2/3 rounded-sm bg-white/5" />
              </div>

              {/* Meta row */}
              <div className="mt-3 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="size-3.5 rounded-sm bg-white/8" />
                  <div className="h-3 w-36 rounded-sm bg-white/5" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3.5 rounded-sm bg-white/8" />
                  <div className="h-3 w-20 rounded-sm bg-white/5" />
                </div>
              </div>

              {/* Category pills */}
              <div className="mt-3 flex gap-2">
                <div className="h-6 w-20 rounded-sm bg-[#3b336a]/30" />
                <div className="h-6 w-16 rounded-sm bg-[#3b336a]/30" />
                <div className="h-6 w-24 rounded-sm bg-[#3b336a]/30" />
              </div>
            </div>

            {/* Right: arrow placeholder */}
            <div className="shrink-0 sm:pr-2">
              <div className="size-10 rounded-sm bg-[#3b336a]/20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
