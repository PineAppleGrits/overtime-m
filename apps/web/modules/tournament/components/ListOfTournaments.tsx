import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, ChevronRight, Trophy } from "lucide-react"
import TournamentService from "../TournamentService"
import { isPubliclyVisibleTournament } from "../constants"
import { ErrorState } from "@/modules/common/components/ErrorState"

function formatRegistrationPeriod(
  start?: string | null,
  end?: string | null
): string | null {
  if (!start && !end) return null
  try {
    if (start && end) {
      return `Del ${format(new Date(start), "d 'de' MMMM", { locale: es })} al ${format(new Date(end), "d 'de' MMMM yyyy", { locale: es })}`
    }
    if (start) {
      return `Desde el ${format(new Date(start), "d 'de' MMMM yyyy", { locale: es })}`
    }
    if (end) {
      return `Hasta el ${format(new Date(end), "d 'de' MMMM yyyy", { locale: es })}`
    }
  } catch {
    return null
  }
  return null
}

const getTorneos = async () => {
  try {
    const data = await TournamentService.getTournaments()
    return { data, error: false as const }
  } catch (error) {
    console.error(error)
    return { data: null, error: true as const }
  }
}

export async function ListOfTournaments() {
  const result = await getTorneos()

  if (result.error || !result.data) {
    return (
      <ErrorState
        title="No pudimos cargar los torneos"
        description="Hubo un problema al obtener el listado. Probá nuevamente en unos segundos."
      />
    )
  }

  const filteredTournaments = result.data.data.filter(isPubliclyVisibleTournament)

  if (filteredTournaments.length === 0) {
    return (
      <div className="py-16 text-center" role="status">
        <div className="text-[#4e4585] text-6xl font-946-latin mb-4">—</div>
        <p className="text-[#a9a5bb] font-din-display uppercase text-sm">
          No hay torneos disponibles por el momento
        </p>
        <p className="mt-2 text-xs text-[#a9a5bb]/50">
          Volvé más tarde para ver los próximos torneos.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4" role="list">
      {filteredTournaments.map((tournament, idx) => {
        const visibleCategories = tournament.categories?.filter((c) => !c.hidden) ?? []
        const registrationPeriod = formatRegistrationPeriod(
          tournament.registrationStartDate,
          tournament.registrationEndDate
        )

        return (
          <Link
            key={tournament.id}
            href={`/torneos/${tournament.slug}`}
            className="group relative overflow-hidden rounded-sm cursor-pointer transition-shadow hover:shadow-xl"
            role="listitem"
          >
            {/* Card background */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  idx % 2 === 0
                    ? 'linear-gradient(135deg, #2a2548 0%, #181525 100%)'
                    : 'linear-gradient(135deg, #1f1b33 0%, #181525 100%)',
              }}
            />
            {/* Hover gradient */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  'linear-gradient(135deg, rgba(59, 51, 106, 0.5) 0%, rgba(255, 59, 47, 0.08) 100%)',
              }}
            />

            {/* Left accent line */}
            <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#3b336a] group-hover:bg-ot-orange transition-colors duration-300" />

            <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Left: info */}
              <div className="flex-1 min-w-0 pl-2">
                <h2 className="text-lg sm:text-xl font-semibold uppercase font-din-display text-white group-hover:text-ot-orange transition-colors duration-300 tracking-tight">
                  {tournament.name}
                </h2>

                {tournament.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-[#a9a5bb]">
                    {tournament.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {registrationPeriod && (
                    <div className="flex items-center gap-2 text-xs text-[#a9a5bb]">
                      <Calendar className="size-3.5 shrink-0 text-ot-orange/70" aria-hidden />
                      <span>{registrationPeriod}</span>
                    </div>
                  )}

                  {visibleCategories.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-[#a9a5bb]">
                      <Trophy className="size-3.5 shrink-0 text-[#4e4585]" aria-hidden />
                      <span>
                        {visibleCategories.length} categoría{visibleCategories.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Category pills */}
                {visibleCategories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleCategories.map((category) => (
                      <span
                        key={category.id}
                        className="inline-block rounded-sm bg-[#3b336a]/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#a9a5bb] font-din-display"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: arrow */}
              <div className="shrink-0 flex items-center sm:pr-2">
                <div className="flex size-10 items-center justify-center rounded-sm bg-[#3b336a]/30 group-hover:bg-ot-orange/20 transition-colors duration-300">
                  <ChevronRight
                    className="size-5 text-[#4e4585] group-hover:text-ot-orange transition-all duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
