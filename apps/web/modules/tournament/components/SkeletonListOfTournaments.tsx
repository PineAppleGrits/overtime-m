export function SkeletonListOfTournaments() {
  return (
    <ul
      role="status"
      aria-label="Cargando torneos"
      className="flex flex-col gap-4"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-ot-dark-blue/30 p-5 animate-pulse sm:flex-row sm:items-center"
        >
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            <div className="h-5 w-1/2 rounded-full bg-white/10" />
            <div className="mt-2 space-y-1.5">
              <div className="h-3 w-full rounded-full bg-white/10" />
              <div className="h-3 w-2/3 rounded-full bg-white/10" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-full bg-white/10" />
              <div className="h-3 w-44 rounded-full bg-white/10" />
            </div>
            <div className="mt-3 flex gap-2">
              <div className="h-6 w-20 rounded-full bg-white/10" />
              <div className="h-6 w-16 rounded-full bg-white/10" />
              <div className="h-6 w-24 rounded-full bg-white/10" />
            </div>
          </div>

          {/* Right: CTA */}
          <div className="shrink-0">
            <div className="h-10 w-32 rounded-xl bg-white/10" />
          </div>
        </li>
      ))}
    </ul>
  )
}
