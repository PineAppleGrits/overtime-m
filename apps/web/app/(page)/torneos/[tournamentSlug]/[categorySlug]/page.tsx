import TournamentService from "@/modules/tournament/TournamentService"
import RegistrationService from "@/modules/registration/RegistrationService"
import { getProfile } from "@/lib/auth/session"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Users, MapPin, ArrowRight, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { CategoryRegistrationBlock } from "./CategoryRegistrationBlock"
import { CategoryDetailContent } from "@/modules/tournament/components/CategoryDetailContent"
import paymentConfigMock from "@/mock/registration-payment-config.json"

function isRegistrationOpen(tournament: {
  status?: string
  registrationStartDate?: string | null
  registrationEndDate?: string | null
}): boolean {
  const status = tournament.status
  if (status !== "visible" && status !== "invisible") return false
  const now = new Date()
  if (
    tournament.registrationStartDate &&
    new Date(tournament.registrationStartDate) > now
  )
    return false
  if (
    tournament.registrationEndDate &&
    new Date(tournament.registrationEndDate) < now
  )
    return false
  return true
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount)
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ tournamentSlug: string; categorySlug: string }>
}) {
  const { tournamentSlug, categorySlug } = await params
  const [tournament, profile] = await Promise.all([
    TournamentService.getTournamentBySlug(tournamentSlug),
    getProfile(),
  ])

  if (!tournament) notFound()

  const category = tournament.categories?.find(
    (c) => c.slug === categorySlug || c.id === categorySlug
  )

  if (!category) notFound()

  const registrationsResponse = await RegistrationService.getRegistrations({
    categoryId: category.id,
    limit: 500,
  })
  const registrations = registrationsResponse?.data ?? []
  const spotsTaken = registrations.filter(
    (r: { status?: string }) => r.status !== "rechazada"
  ).length
  const zonesCount = category.zones?.length ?? 0
  const teamsPerZone = category.teamsPerZone ?? 0
  const totalSpots =
    zonesCount > 0 && teamsPerZone > 0 ? zonesCount * teamsPerZone : null
  const spotsLeft =
    totalSpots !== null ? Math.max(0, totalSpots - spotsTaken) : null

  const myRegistration = profile
    ? registrations.find(
        (r: { requester?: { id?: string } }) => r.requester?.id === profile.id
      )
    : null

  const registrationOpen = isRegistrationOpen(tournament)
  const canRegister =
    registrationOpen &&
    (totalSpots === null || (spotsLeft !== null && spotsLeft > 0)) &&
    !myRegistration

  // Payment config (TODO: fetch GET /tournaments/:id/payment-config when available)
  const paymentConfig = (paymentConfigMock as Record<string, typeof paymentConfigMock["fallback"]>)["fallback"]

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
          <p className="mt-2 text-white/70">{tournament.name} · Categoría</p>
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

          {/* UC-REG-VIEW-01 — Vista de inscripción pendiente con info de pago */}
          {myRegistration && (
            <div className="space-y-4 max-w-2xl">
              {/* Header */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <p className="font-semibold text-amber-200">
                  Tu inscripción está en revisión
                </p>
                <p className="mt-0.5 text-sm text-amber-200/70">
                  El organizador revisará tu solicitud. Mientras tanto, podés abonar
                  la inscripción con los métodos disponibles.
                </p>
              </div>

              {/* Sección de pago */}
              <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-5 space-y-4">
                <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider">
                  Información de pago
                </h2>

                {/* Montos */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-white/40 text-xs mb-0.5">Arancel de inscripción</p>
                    <p className="text-white font-semibold">
                      {formatCurrency(paymentConfig.inscriptionFee)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-white/40 text-xs mb-0.5">Seguro por jugador</p>
                    <p className="text-white font-semibold">
                      {formatCurrency(paymentConfig.insuranceFeePerPlayer)}
                    </p>
                  </div>
                </div>

                {/* Métodos de pago */}
                {paymentConfig.paymentMethods.cash.enabled && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                      Efectivo en sede
                    </p>
                    <ul className="space-y-1.5">
                      {paymentConfig.paymentMethods.cash.venues.map((venue) => (
                        <li
                          key={venue.name}
                          className="flex items-start gap-2 text-sm text-white/70"
                        >
                          <MapPin className="h-3.5 w-3.5 text-ot-orange shrink-0 mt-0.5" />
                          <span>
                            <span className="text-white">{venue.name}</span>
                            <span className="text-white/40"> — {venue.address}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {paymentConfig.paymentMethods.transfer.enabled && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                      Transferencia bancaria
                    </p>
                    <div className="rounded-lg bg-white/5 p-3 space-y-1 text-sm">
                      <div className="flex gap-2">
                        <span className="text-white/40 w-16">Alias</span>
                        <span className="text-white font-mono">
                          {paymentConfig.paymentMethods.transfer.alias}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-white/40 w-16">CBU</span>
                        <span className="text-white font-mono text-xs">
                          {paymentConfig.paymentMethods.transfer.cbu}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-white/40 w-16">Banco</span>
                        <span className="text-white/70">
                          {paymentConfig.paymentMethods.transfer.bankName}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-white/40 w-16">Titular</span>
                        <span className="text-white/70">
                          {paymentConfig.paymentMethods.transfer.holder}
                        </span>
                      </div>
                    </div>

                    {/* Subir comprobante */}
                    <Link
                      href={`/profile/equipos`}
                      className="inline-flex items-center gap-2 rounded-lg border border-ot-orange/40 px-4 py-2 text-sm text-ot-orange hover:bg-ot-orange/10 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Subir comprobante
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <p className="text-xs text-white/30">
                      Subí el comprobante desde el balance de tu equipo.
                    </p>
                  </div>
                )}
              </div>
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

        {/* Tabs: Posiciones, Fixture, Mi Equipo */}
        <CategoryDetailContent
          categoryName={category.name}
          tournamentSlug={tournamentSlug}
          categorySlug={categorySlug}
          // TODO: conectar con API — usar estado real de inscripción aprobada
          isMyTeamPlaying={!!myRegistration && myRegistration.status === 'approved'}
          myTeamId={myRegistration?.team?.id}
          categoryId={category.id}
        />
      </div>
    </div>
  )
}
