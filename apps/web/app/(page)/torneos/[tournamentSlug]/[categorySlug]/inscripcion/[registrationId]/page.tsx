import { getProfile } from "@/lib/auth/session"
import registrationService from "@/modules/registration/RegistrationService"
import TournamentService from "@/modules/tournament/TournamentService"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  MapPin,
  Building2,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CopyButtonClient } from "./CopyButtonClient"

// TODO: fetch from API when available
function getPaymentConfig() {
  return {
    inscriptionFee: 12000,
    insuranceFeePerPlayer: 1000,
    paymentMethods: {
      cash: {
        enabled: true,
        venues: [
          { name: "Sede Central Overtime", address: "Av. Corrientes 1234, CABA" },
          { name: "Complejo Deportivo Norte", address: "Av. Cabildo 5678, CABA" },
        ],
      },
      transfer: {
        enabled: true,
        alias: "overtime.deportes",
        cbu: "0000003100012345678901",
        bankName: "Banco Nación",
        holder: "Overtime Deportes SRL",
      },
    },
  }
}

const STATUS_CONFIG = {
  pending: {
    label: "Pendiente de aprobación",
    description: "Tu inscripción está siendo revisada. Te notificaremos cuando sea aprobada.",
    icon: Clock,
    className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    iconColor: "text-amber-400",
  },
  approved: {
    label: "Aprobada",
    description: "Tu inscripción fue aprobada. Realizá el pago para confirmar tu lugar.",
    icon: CheckCircle2,
    className: "bg-green-500/20 text-green-300 border-green-500/30",
    iconColor: "text-green-400",
  },
  rejected: {
    label: "Rechazada",
    description: "Tu inscripción fue rechazada.",
    icon: XCircle,
    className: "bg-red-500/20 text-red-400 border-red-500/30",
    iconColor: "text-red-400",
  },
} as const

export default async function InscripcionDetailPage({
  params,
}: {
  params: Promise<{
    tournamentSlug: string
    categorySlug: string
    registrationId: string
  }>
}) {
  const { tournamentSlug, categorySlug, registrationId } = await params

  type RegistrationDetail = {
    id: string
    status: string
    rejectionReason?: string | null
    team?: { id: string; name: string; logoUrl?: string | null }
    tournament?: { id: string; name: string; slug?: string }
    category?: { id: string; name: string; slug?: string }
    rosterEntries?: { id: string; profile?: { id: string; name: string } }[]
    createdAt?: string
  }

  const [profile, registrationResult, tournamentResult] = await Promise.all([
    getProfile(),
    registrationService
      .getRegistrationById(registrationId)
      .then((r) => r as RegistrationDetail)
      .catch(() => null),
    TournamentService.getTournamentBySlug(tournamentSlug).catch(() => null),
  ])

  if (!profile) {
    redirect(
      `/auth/login?redirect=${encodeURIComponent(`/torneos/${tournamentSlug}/${categorySlug}/inscripcion/${registrationId}`)}`,
    )
  }

  if (!registrationResult) notFound()
  const registration = registrationResult

  const tournament: { id: string; name: string; slug?: string } | null = tournamentResult

  const paymentConfig = getPaymentConfig()
  const status = STATUS_CONFIG[registration.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  const StatusIcon = status.icon
  const playerCount = registration.rosterEntries?.length ?? 0
  const inscriptionFee = paymentConfig.inscriptionFee
  const insuranceFee = paymentConfig.insuranceFeePerPlayer * playerCount
  const totalFee = inscriptionFee + insuranceFee

  return (
    <div className="min-h-screen bg-ot-background text-white">
      {/* Header */}
      <div className="relative bg-[#181525] overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 120%, rgba(59, 51, 106, 0.8) 0%, transparent 70%)",
          }}
        />
        <div className="relative ot-container py-8 md:py-12">
          <Link
            href={`/torneos/${tournamentSlug}/${categorySlug}/inscribirse`}
            className="inline-flex items-center gap-1.5 text-sm text-[#a9a5bb] hover:text-ot-orange transition-colors mb-4 font-din-display uppercase"
          >
            <ChevronLeft className="size-4" />
            Volver a inscripción
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Team info */}
            <div className="flex items-center gap-3">
              {registration.team?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={registration.team.logoUrl}
                  alt={registration.team.name}
                  className="size-14 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl font-bold text-white/40">
                  {registration.team?.name?.charAt(0).toUpperCase() ?? "?"}
                </div>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-white">
                  {registration.team?.name ?? "Equipo"}
                </h1>
                <p className="text-sm text-[#a9a5bb]">
                  {tournament?.name ?? registration.tournament?.name ?? "Torneo"} &middot;{" "}
                  {registration.category?.name ?? "Categoría"}
                </p>
              </div>
            </div>

            {/* Status badge */}
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium sm:ml-auto shrink-0 w-fit",
                status.className,
              )}
            >
              <StatusIcon className="size-4" />
              {status.label}
            </span>
          </div>
        </div>
      </div>

      <div className="ot-container py-6 md:py-10 space-y-6 max-w-2xl">
        {/* Status message */}
        <div
          className={cn(
            "rounded-xl border p-4",
            registration.status === "rejected"
              ? "border-red-500/30 bg-red-500/10"
              : "border-ot-light-blue/50 bg-ot-dark-blue/30",
          )}
        >
          <p className="text-sm text-white/70">{status.description}</p>
          {registration.status === "rejected" && registration.rejectionReason && (
            <p className="mt-2 text-sm text-red-400">
              Motivo: {registration.rejectionReason}
            </p>
          )}
        </div>

        {/* Fee breakdown */}
        <section className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Detalle del pago
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Inscripción</span>
              <span className="text-white">
                ${inscriptionFee.toLocaleString("es-AR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50 flex items-center gap-1.5">
                <Users className="size-3.5" />
                Seguro ({playerCount} jugadores)
              </span>
              <span className="text-white">
                ${insuranceFee.toLocaleString("es-AR")}
              </span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
              <span className="text-white">Total</span>
              <span className="text-ot-orange text-lg font-din-display">
                ${totalFee.toLocaleString("es-AR")}
              </span>
            </div>
          </div>
        </section>

        {/* Payment methods */}
        {registration.status !== "rejected" && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              Medios de pago
            </h2>

            {/* Transfer */}
            {paymentConfig.paymentMethods.transfer.enabled && (
              <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-ot-orange" />
                  <h3 className="text-sm font-semibold text-white">
                    Transferencia bancaria
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-white/40 text-xs mb-1">Alias</p>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium font-mono text-base bg-white/5 px-3 py-1.5 rounded-lg">
                        {paymentConfig.paymentMethods.transfer.alias}
                      </span>
                      <CopyButtonClient text={paymentConfig.paymentMethods.transfer.alias} />
                    </div>
                  </div>

                  <div>
                    <p className="text-white/40 text-xs mb-1">CBU</p>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-xs bg-white/5 px-3 py-1.5 rounded-lg">
                        {paymentConfig.paymentMethods.transfer.cbu}
                      </span>
                      <CopyButtonClient text={paymentConfig.paymentMethods.transfer.cbu} />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div>
                      <p className="text-white/40 text-xs mb-0.5">Banco</p>
                      <p className="text-white">
                        {paymentConfig.paymentMethods.transfer.bankName}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-0.5">Titular</p>
                      <p className="text-white">
                        {paymentConfig.paymentMethods.transfer.holder}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cash */}
            {paymentConfig.paymentMethods.cash.enabled && (
              <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-ot-orange" />
                  <h3 className="text-sm font-semibold text-white">Pago en efectivo</h3>
                </div>

                <div className="space-y-3">
                  {paymentConfig.paymentMethods.cash.venues.map((venue, i) => (
                    <div
                      key={venue.name}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="size-6 shrink-0 flex items-center justify-center rounded-full bg-white/5 text-white/30 text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{venue.name}</p>
                        <p className="text-white/50 text-xs">{venue.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Upload voucher placeholder */}
        {registration.status !== "rejected" && (
          <section className="rounded-xl border border-dashed border-ot-light-blue/50 bg-ot-dark-blue/20 p-6 text-center space-y-2">
            <p className="text-sm text-white/50">
              Próximamente vas a poder subir tu comprobante de pago desde acá.
            </p>
            <p className="text-xs text-white/30">
              Por ahora, enviá el comprobante por WhatsApp o mail al organizador.
            </p>
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={`/torneos/${tournamentSlug}/${categorySlug}/inscribirse`}
            className="border border-ot-orange/40 text-ot-orange hover:bg-ot-orange/10 rounded-lg px-5 py-2.5 text-sm transition-colors"
          >
            Inscribir otro equipo
          </Link>
          <Link
            href={`/torneos/${tournamentSlug}/${categorySlug}`}
            className="border border-white/20 text-white/60 hover:text-white rounded-lg px-5 py-2.5 text-sm transition-colors"
          >
            Ir a la categoría
          </Link>
        </div>
      </div>
    </div>
  )
}
