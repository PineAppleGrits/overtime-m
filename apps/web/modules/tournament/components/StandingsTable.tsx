'use client'

type StandingEntry = {
  position: number
  teamName: string
  teamLogo: string | null
  teamId: string
  played: number
  won: number
  lost: number
  pointsFor: number
  pointsAgainst: number
  diff: number
  points: number
}

function getPositionBg(idx: number) {
  if (idx === 0) return 'bg-[#3b336a]/80'
  if (idx % 2 === 0) return 'bg-[#1f1b33]'
  return 'bg-[#181525]'
}

function getPositionColor(idx: number) {
  if (idx < 3) return 'text-ot-orange'
  if (idx < 7) return 'text-white/60'
  return 'text-[#4e4585]'
}

const DEFAULT_BADGE = '/badge-placeholder.png'

export function StandingsTable({
  standings,
  zoneName,
}: {
  standings: StandingEntry[]
  zoneName?: string
}) {
  return (
    <div className="pb-10">
      {zoneName && (
        <div className="text-xl text-center text-ot-orange font-bold uppercase font-din-display mb-1">
          <h2>{zoneName}</h2>
        </div>
      )}
      <h3 className="font-semibold uppercase text-sm text-center text-white/80 pb-4 font-din-display">
        Tabla del torneo
      </h3>
      <div className="w-full shadow-lg uppercase">
        {/* Header */}
        <div className="flex h-10 items-center bg-[#3b336a] text-xs font-bold font-din-display">
          <div className="w-[8%] text-center text-white/60">#</div>
          <div className="w-[52%] text-left text-white/60 pl-2">equipo</div>
          <div className="w-[40%] h-full flex items-center text-white/60 bg-[#3b336a]">
            <div className="w-1/4 text-center">pj</div>
            <div className="w-1/4 text-center">pg</div>
            <div className="w-1/4 text-center">pp</div>
            <div className="w-1/4 text-center">dp</div>
          </div>
        </div>

        {/* Rows */}
        {standings.map((row, idx) => (
          <div
            key={row.teamId}
            className={`${getPositionBg(idx)} flex h-10 items-center text-sm font-bold font-946-latin`}
          >
            <div className={`w-[8%] text-center ${getPositionColor(idx)}`}>
              {row.position}
            </div>
            <div className="w-[52%] flex items-center gap-2 pl-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.teamLogo ?? DEFAULT_BADGE}
                alt=""
                className="size-6 object-contain"
              />
              <span className="text-xs sm:text-sm font-thin font-din-display text-white mt-0.5 truncate">
                {row.teamName}
              </span>
            </div>
            <div
              className="w-[40%] h-full flex items-center text-white/80 font-thin"
              style={{
                background:
                  'linear-gradient(90deg, rgba(59, 51, 106, 0.3) 0%, rgba(59, 51, 106, 0) 100%)',
              }}
            >
              <div className="w-1/4 text-center">{row.played}</div>
              <div className="w-1/4 text-center">{row.won}</div>
              <div className="w-1/4 text-center">{row.lost}</div>
              <div className="w-1/4 text-center">
                {row.diff > 0 ? `+${row.diff}` : row.diff}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="pt-4 text-xs font-din-display text-center text-white/60">
        PJ: Partidos Jugados - PG: Partidos Ganados - PP: Partidos Perdidos - DP: Diferencia de Puntos
      </p>
    </div>
  )
}
