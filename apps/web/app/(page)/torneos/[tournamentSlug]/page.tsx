import TournamentService from "@/modules/tournament/TournamentService";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronRight, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

function formatRegistrationPeriod(
  start?: string | null,
  end?: string | null
): string | null {
  if (!start && !end) return null;
  try {
    if (start && end) {
      return `Del ${format(new Date(start), "d 'de' MMMM", { locale: es })} al ${format(new Date(end), "d 'de' MMMM yyyy", { locale: es })}`;
    }
    if (start) {
      return `Desde el ${format(new Date(start), "d 'de' MMMM yyyy", { locale: es })}`;
    }
    if (end) {
      return `Hasta el ${format(new Date(end), "d 'de' MMMM yyyy", { locale: es })}`;
    }
  } catch {
    return null;
  }
  return null;
}

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ tournamentSlug: string }>;
}) {
  const { tournamentSlug } = await params;
  const tournament = await TournamentService.getTournamentBySlug(tournamentSlug);
  const categories = tournament.categories?.filter((c) => !c.hidden) ?? [];
  const registrationPeriod = formatRegistrationPeriod(
    tournament.registrationStartDate,
    tournament.registrationEndDate
  );

  return (
    <div className="min-h-screen bg-ot-background text-white">
      <article className="ot-container py-10 md:py-14" aria-labelledby="tournament-title">
        {/* Header */}
        <header className="mb-10 md:mb-14">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-white/70">
              <li>
                <Link
                  href="/torneos"
                  className="hover:text-ot-orange focus:outline-none focus:ring-2 focus:ring-ot-orange focus:ring-offset-2 focus:ring-offset-ot-background rounded"
                >
                  Torneos
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white" aria-current="page">
                {tournament.name}
              </li>
            </ol>
          </nav>

          <h1
            id="tournament-title"
            className="text-3xl font-bold tracking-tight text-white md:text-4xl"
          >
            {tournament.name}
          </h1>

          {tournament.description && (
            <p className="mt-4 max-w-2xl text-lg text-white/80">
              {tournament.description}
            </p>
          )}

          {registrationPeriod && (
            <div
              className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-ot-dark-blue/40 px-4 py-3 text-white/90"
              aria-label="Período de inscripción"
            >
              <Calendar className="h-5 w-5 shrink-0 text-ot-orange" aria-hidden />
              <span className="text-sm font-medium">Inscripción:</span>
              <span className="text-sm">{registrationPeriod}</span>
            </div>
          )}
        </header>

        {/* Categories */}
        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="sr-only">
            Categorías del torneo
          </h2>

          {categories.length === 0 ? (
            <div
              className="rounded-2xl border border-white/10 bg-ot-dark-blue/20 px-6 py-12 text-center"
              role="status"
            >
              <Trophy className="mx-auto h-12 w-12 text-white/40" aria-hidden />
              <p className="mt-4 text-white/70">
                Aún no hay categorías publicadas para este torneo.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/torneos/${tournamentSlug}/${category.slug ?? category.id}`}
                    className={cn(
                      "group flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-ot-dark-blue/30 p-5",
                      "transition-colors hover:border-ot-orange/40 hover:bg-ot-dark-blue/50",
                      "focus:outline-none focus:ring-2 focus:ring-ot-orange focus:ring-offset-2 focus:ring-offset-ot-background"
                    )}
                  >
                    <span className="font-semibold text-white group-hover:text-ot-orange">
                      {category.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-sm text-white/70 group-hover:text-ot-orange">
                      Postularse
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </div>
  );
}
