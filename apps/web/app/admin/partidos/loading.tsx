export default function PartidosLoading() {
  return (
    <div
      className="-m-6 lg:-m-8 overflow-hidden bg-[#f7f6f4] flex flex-col"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      {/* Top bar skeleton */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e8e6e1] bg-white px-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#e8e6e1] animate-pulse" />
          <div className="h-7 w-7 rounded-lg bg-[#e8e6e1] animate-pulse" />
          <div className="h-5 w-36 rounded bg-[#e8e6e1] animate-pulse" />
          <div className="h-7 w-7 rounded-lg bg-[#e8e6e1] animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-56 rounded-lg bg-[#e8e6e1] animate-pulse" />
          <div className="h-8 w-28 rounded-lg bg-[#e8e6e1] animate-pulse" />
        </div>
      </div>

      {/* Day headers skeleton */}
      <div className="grid grid-cols-7 border-b border-[#e8e6e1] bg-white">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center h-10">
            <div className="h-4 w-6 rounded bg-[#e8e6e1] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Calendar grid skeleton */}
      <div className="flex-1 grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="border-r border-b border-[#e8e6e1] p-2 space-y-1">
            <div className="h-4 w-4 rounded bg-[#e8e6e1] animate-pulse" />
            {i % 5 === 0 && <div className="h-5 w-full rounded bg-[#e8e6e1] animate-pulse" />}
            {i % 7 === 0 && <div className="h-5 w-full rounded bg-[#e8e6e1] animate-pulse" />}
          </div>
        ))}
      </div>
    </div>
  )
}
