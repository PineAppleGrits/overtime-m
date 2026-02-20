import TournamentService from "@/modules/tournament/TournamentService";
import RegistrationService from "@/modules/registration/RegistrationService";
import { getProfile } from "@/lib/auth/session";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryRegistrationBlock } from "./CategoryRegistrationBlock";

function isRegistrationOpen(tournament: {
  status?: string;
  registrationStartDate?: string | null;
  registrationEndDate?: string | null;
}): boolean {
  const status = tournament.status;
  if (status !== "visible" && status !== "invisible") return false;
  const now = new Date();
  if (
    tournament.registrationStartDate &&
    new Date(tournament.registrationStartDate) > now
  )
    return false;
  if (
    tournament.registrationEndDate &&
    new Date(tournament.registrationEndDate) < now
  )
    return false;
  return true;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ tournamentSlug: string; categorySlug: string }>;
}) {
  const { tournamentSlug, categorySlug } = await params;
  const [tournament, profile] = await Promise.all([
    TournamentService.getTournamentBySlug(tournamentSlug),
    getProfile(),
  ]);

  if (!tournament) notFound();

  const category = tournament.categories?.find(
    (c) => c.id === categorySlug || (c as { slug?: string }).slug === categorySlug
  );

  if (!category) notFound();

  const registrationsResponse = await RegistrationService.getRegistrations({
    categoryId: category.id,
    limit: 500,
  });
  const registrations = registrationsResponse?.data ?? [];
  const spotsTaken = registrations.filter(
    (r: { status?: string }) => r.status !== "rechazada"
  ).length;
  const zonesCount = category.zones?.length ?? 0;
  const teamsPerZone = category.teamsPerZone ?? 0;
  const totalSpots =
    zonesCount > 0 && teamsPerZone > 0 ? zonesCount * teamsPerZone : null;
  const spotsLeft =
    totalSpots !== null ? Math.max(0, totalSpots - spotsTaken) : null;

  const myRegistration = profile
    ? registrations.find(
        (r: { requester?: { id?: string } }) => r.requester?.id === profile.id
      )
    : null;

  const registrationOpen = isRegistrationOpen(tournament);
  const canRegister =
    registrationOpen &&
    (totalSpots === null || (spotsLeft !== null && spotsLeft > 0)) &&
    !myRegistration;

  return (
    <div className="min-h-screen bg-ot-background text-white">
      <div className="ot-container py-8 md:py-12">
        <nav aria-label="Navegación" className="mb-8">
          <Link
            href={`/torneos/${tournamentSlug}`}
            className={cn(
              "inline-flex items-center gap-2 text-sm text-white/70 hover:text-ot-orange",
              "focus:outline-none focus:ring-2 focus:ring-ot-orange focus:ring-offset-2 focus:ring-offset-ot-background rounded"
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Volver al torneo
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {category.name}
          </h1>
          <p className="mt-2 text-white/70">
            {tournament.name} · Categoría
          </p>
        </header>

        {/* Zonas */}
        {category.zones?.length > 0 && (
          <section className="mb-8" aria-labelledby="zones-heading">
            <h2 id="zones-heading" className="sr-only">
              Zonas de la categoría
            </h2>
            <ul className="flex flex-wrap gap-2" role="list">
              {category.zones.map((zone: { id: string; name: string }) => (
                <li key={zone.id}>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-ot-dark-blue/40 px-3 py-1 text-sm text-white/90"
                    )}
                  >
                    <Users className="h-3.5 w-3" aria-hidden />
                    {zone.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Pill cupos + bloque inscripción */}
        <div className="space-y-6">
          {totalSpots !== null && (
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
                  spotsLeft !== null && spotsLeft === 0
                    ? "bg-red-500/20 text-red-400"
                    : "bg-ot-light-blue/40 text-white"
                )}
                aria-live="polite"
              >
                {spotsLeft !== null
                  ? spotsLeft === 0
                    ? "Sin cupos disponibles"
                    : `${spotsLeft} cupo${spotsLeft !== 1 ? "s" : ""} disponible${spotsLeft !== 1 ? "s" : ""}`
                  : `${spotsTaken} inscriptos`}
              </span>
            </div>
          )}

          {myRegistration && (
            <div
              role="status"
              className={cn(
                "rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200"
              )}
            >
              <p className="font-medium">
                Su inscripción está siendo procesada.
              </p>
              <p className="mt-1 text-sm text-amber-200/80">
                Recibirá una respuesta cuando sea revisada por el organizador.
              </p>
            </div>
          )}

          <CategoryRegistrationBlock
            canRegister={canRegister}
            tournamentId={tournament.id}
            tournamentSlug={tournamentSlug}
            categoryId={category.id}
            categorySlug={categorySlug}
            isRegistrationOpen={registrationOpen}
            spotsLeft={spotsLeft}
            hasMyRegistration={!!myRegistration}
          />
        </div>
      </div>
    </div>
  );
}
