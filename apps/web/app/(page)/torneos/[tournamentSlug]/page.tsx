import TournamentService from "@/modules/tournament/TournamentService";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, Users } from "lucide-react";
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, idx) => {
              const isOrange = idx % 2 === 0;
              const zones = category._count?.zones ?? 0;
              const registrations = category._count?.registrations ?? 0;

              return (
                <Link
                  key={category.id}
                  href={`/torneos/${tournamentSlug}/${category.slug ?? category.id}`}
                  className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-lg ring-1 ring-white/5 transition-shadow hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)]"
                >
                  {/* Background image (wrapper handles the smooth transform) */}
                  <div
                    className="absolute inset-0 transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    aria-hidden
                  >
                    <Image
                      src="/images/basket-category-bg.webp"
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>

                  {/* Color tint per index */}
                  <div
                    className="absolute inset-0 mix-blend-multiply opacity-80"
                    style={{
                      background: isOrange
                        ? 'linear-gradient(135deg, rgba(255,59,47,0.55) 0%, rgba(24,21,37,0.95) 100%)'
                        : 'linear-gradient(135deg, rgba(78,69,133,0.55) 0%, rgba(24,21,37,0.95) 100%)',
                    }}
                  />

                  {/* Bottom shading for legibility */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(24,21,37,0) 35%, rgba(24,21,37,0.85) 100%)',
                    }}
                  />

                  {/* Top accent bar */}
                  <div
                    className={`absolute left-0 right-0 top-0 h-[3px] transition-colors ${
                      isOrange ? 'bg-ot-orange' : 'bg-[#7a6dca]'
                    } group-hover:bg-ot-orange`}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col gap-3 p-5 md:p-6">
                    <h3 className="font-din-display text-2xl md:text-3xl font-bold uppercase leading-tight tracking-tight text-white">
                      {category.name}
                    </h3>

                    {(zones > 0 || registrations > 0) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/70">
                        {zones > 0 && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-block h-1 w-1 rounded-full bg-ot-orange" />
                            {zones} zona{zones !== 1 ? 's' : ''}
                          </span>
                        )}
                        {registrations > 0 && (
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-white/50" aria-hidden />
                            {registrations} inscripto{registrations !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-1 inline-flex items-center gap-1.5 font-din-display text-sm font-semibold uppercase tracking-wide text-ot-orange">
                      Ver categoría
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1"
                        aria-hidden
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
