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

export function StandingsTable({
  standings,
}: {
  standings: StandingEntry[]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ot-light-blue/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-ot-dark-blue/50">
            <th className="px-3 py-3 text-left text-[11px] uppercase tracking-wider text-white/40 font-semibold w-10">
              #
            </th>
            <th className="sticky left-0 z-10 bg-ot-dark-blue/50 px-3 py-3 text-left text-[11px] uppercase tracking-wider text-white/40 font-semibold min-w-[140px]">
              Equipo
            </th>
            <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider text-white/40 font-semibold">
              PJ
            </th>
            <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider text-white/40 font-semibold">
              PG
            </th>
            <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider text-white/40 font-semibold">
              PP
            </th>
            <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider text-white/40 font-semibold">
              PF
            </th>
            <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider text-white/40 font-semibold">
              PC
            </th>
            <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider text-white/40 font-semibold">
              DIF
            </th>
            <th className="px-3 py-3 text-center text-[11px] uppercase tracking-wider text-white/40 font-semibold">
              PTS
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr
              key={row.teamId}
              className={`border-t border-ot-light-blue/30 hover:bg-ot-dark-blue/40 transition-colors ${
                row.position === 1 ? 'bg-amber-500/5' : ''
              }`}
            >
              <td className="px-3 py-3 text-white/60 font-semibold">
                {row.position}
              </td>
              <td className="sticky left-0 z-10 bg-ot-dark-blue px-3 py-3">
                <span className="font-din-display font-semibold text-white">
                  {row.teamName}
                </span>
              </td>
              <td className="px-3 py-3 text-center text-white/70">
                {row.played}
              </td>
              <td className="px-3 py-3 text-center text-white/70">
                {row.won}
              </td>
              <td className="px-3 py-3 text-center text-white/70">
                {row.lost}
              </td>
              <td className="px-3 py-3 text-center text-white/70">
                {row.pointsFor}
              </td>
              <td className="px-3 py-3 text-center text-white/70">
                {row.pointsAgainst}
              </td>
              <td
                className={`px-3 py-3 text-center font-semibold ${
                  row.diff > 0
                    ? 'text-green-400'
                    : row.diff < 0
                      ? 'text-red-400'
                      : 'text-white/70'
                }`}
              >
                {row.diff > 0 ? `+${row.diff}` : row.diff}
              </td>
              <td className="px-3 py-3 text-center text-ot-orange font-bold">
                {row.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
