import TournamentService from "@/modules/tournament/TournamentService";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";

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

  let tournament: Awaited<ReturnType<typeof TournamentService.getTournamentBySlug>> | null = null;
  try {
    tournament = await TournamentService.getTournamentBySlug(tournamentSlug);
  } catch {
    notFound();
  }

  if (!tournament) notFound();

  const categories = tournament.categories?.filter((c) => !c.hidden) ?? [];
  const registrationPeriod = formatRegistrationPeriod(
    tournament.registrationStartDate,
    tournament.registrationEndDate
  );

  return (
    <div className="min-h-screen bg-ot-background text-white">
      {/* Hero header */}
      <div className="relative bg-[#181525] overflow-hidden">
        {/* Gradient accents */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 120%, rgba(59, 51, 106, 0.8) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse 40% 60% at 80% 0%, rgba(255, 59, 47, 0.4) 0%, transparent 60%)',
          }}
        />

        <div className="relative ot-container py-14 md:py-20">
          <Link
            href="/torneos"
            className="inline-flex items-center gap-1 text-sm text-[#a9a5bb] hover:text-ot-orange transition-colors mb-6 font-din-display uppercase"
          >
            ‹ Torneos
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold uppercase font-din-display text-ot-orange tracking-tight">
            {tournament.name}
          </h1>

          {tournament.description && (
            <p className="mt-4 max-w-2xl text-[#a9a5bb] text-base md:text-lg">
              {tournament.description}
            </p>
          )}

          {registrationPeriod && (
            <div className="mt-6 inline-flex items-center gap-3 rounded-sm bg-[#2b161f] px-5 py-3">
              <span className="text-ot-orange font-din-display text-sm font-bold uppercase">Inscripción</span>
              <span className="w-px h-4 bg-[#aa2c28]" />
              <span className="text-[#a9a5bb] text-sm">{registrationPeriod}</span>
            </div>
          )}
        </div>
      </div>

      {/* Categories section */}
      <div className="ot-container py-10 md:py-14">
        <h2 className="text-center text-ot-orange font-bold uppercase font-din-display text-lg mb-8">
          Categorías
        </h2>

        {categories.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-[#4e4585] text-6xl font-946-latin mb-4">—</div>
            <p className="text-[#a9a5bb] font-din-display uppercase text-sm">
              Aún no hay categorías publicadas
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, idx) => (
              <Link
                key={category.id}
                href={`/torneos/${tournamentSlug}/${category.slug ?? category.id}`}
                className="group relative overflow-hidden rounded-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
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
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(59, 51, 106, 0.5) 0%, rgba(255, 59, 47, 0.1) 100%)',
                  }}
                />

                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#3b336a] group-hover:bg-ot-orange transition-colors" />

                <div className="relative flex items-center justify-between gap-4 p-6">
                  <div>
                    <span className="block font-din-display font-bold text-white uppercase text-lg group-hover:text-ot-orange transition-colors">
                      {category.name}
                    </span>
                    {category._count && (
                      <span className="block mt-1 text-xs text-[#a9a5bb]">
                        {category._count.zones > 0 && `${category._count.zones} zona${category._count.zones !== 1 ? 's' : ''}`}
                        {category._count.zones > 0 && category._count.registrations > 0 && ' · '}
                        {category._count.registrations > 0 && `${category._count.registrations} inscripto${category._count.registrations !== 1 ? 's' : ''}`}
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-[#4e4585] group-hover:text-ot-orange transition-colors"
                    aria-hidden
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
