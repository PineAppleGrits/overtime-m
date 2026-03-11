export function SkeletonListOfTournaments() {
  return (
    <ul
      role="status"
      aria-label="Cargando torneos"
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="flex h-full flex-col rounded-2xl border border-white/10 bg-ot-dark-blue/30 p-5 animate-pulse"
        >
          {/* Name */}
          <div className="h-5 w-3/4 rounded-full bg-white/10" />

          {/* Description */}
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded-full bg-white/10" />
            <div className="h-3 w-2/3 rounded-full bg-white/10" />
          </div>

          {/* Registration period */}
          <div className="mt-3 flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-full bg-white/10" />
            <div className="h-3 w-40 rounded-full bg-white/10" />
          </div>

          {/* Categories label */}
          <div className="mt-4">
            <div className="mb-2 h-2.5 w-16 rounded-full bg-white/10" />
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-20 rounded-full bg-white/10" />
              <div className="h-6 w-16 rounded-full bg-white/10" />
              <div className="h-6 w-24 rounded-full bg-white/10" />
            </div>
          </div>

          {/* CTA button */}
          <div className="mt-5 h-10 w-full rounded-xl bg-white/10" />
        </li>
      ))}
    </ul>
  )
}
