import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, ChevronRight, Trophy } from "lucide-react"
import TournamentService from "../TournamentService"

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
    return data
  } catch (error) {
    console.error(error)
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    }
  }
}

export async function ListOfTournaments() {
  const { data: tournaments } = await getTorneos()
  const filteredTournaments = tournaments.filter((t) => !t.hidden)

  if (filteredTournaments.length === 0) {
    return (
      <div
        className="rounded-2xl border border-white/10 bg-ot-dark-blue/20 px-6 py-16 text-center"
        role="status"
      >
        <Trophy className="mx-auto h-12 w-12 text-white/40" aria-hidden />
        <p className="mt-4 text-white/70">No hay torneos disponibles por el momento.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-4" role="list">
      {filteredTournaments.map((tournament) => {
        const visibleCategories = tournament.categories?.filter((c) => !c.hidden) ?? []
        const registrationPeriod = formatRegistrationPeriod(
          tournament.registrationStartDate,
          tournament.registrationEndDate
        )

        return (
          <li key={tournament.id}>
            <article className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-ot-dark-blue/30 p-5 transition-colors hover:border-ot-orange/30 hover:bg-ot-dark-blue/50 sm:flex-row sm:items-center">

              {/* Left: info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white">{tournament.name}</h2>

                {tournament.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-white/60">
                    {tournament.description}
                  </p>
                )}

                {registrationPeriod && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-ot-orange" aria-hidden />
                    <span>{registrationPeriod}</span>
                  </div>
                )}

                {/* Categories */}
                <div className="mt-3">
                  {visibleCategories.length > 0 ? (
                    <ul className="flex flex-wrap gap-2" role="list">
                      {visibleCategories.map((category) => (
                        <li key={category.id}>
                          <span className="inline-block rounded-full border border-ot-orange/30 bg-ot-orange/10 px-3 py-1 text-xs font-medium text-ot-orange">
                            {category.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-white/40">Sin categorías publicadas</p>
                  )}
                </div>
              </div>

              {/* Right: CTA */}
              <div className="shrink-0">
                <Link
                  href={`/torneos/${tournament.slug}`}
                  className="group inline-flex items-center gap-2 rounded-xl bg-ot-orange/90 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ot-orange focus:outline-none focus:ring-2 focus:ring-ot-orange focus:ring-offset-2 focus:ring-offset-ot-background whitespace-nowrap"
                >
                  Ver torneo
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
