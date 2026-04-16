"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
  Trophy,
  CreditCard,
  Copy,
  Check,
  Plus,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { createMultiRegistrationAction } from "@/modules/registration/actions/registrationActions"
import type {
  MyTeam,
  ExistingRegistration,
  TournamentInfo,
  CategoryInfo,
  PaymentConfig,
} from "./page"

type Props = {
  tournament: TournamentInfo
  category: CategoryInfo
  teams: MyTeam[]
  existingRegistrations: ExistingRegistration[]
  paymentConfig: PaymentConfig
}

type TeamSelection = {
  teamId: string
  playerIds: string[]
}

const MIN_PLAYERS = 8
const STEPS = [
  { label: "Equipo", icon: Users },
  { label: "Jugadores", icon: Users },
  { label: "Resumen", icon: CreditCard },
]

function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null
  try {
    return format(new Date(dateStr), "d 'de' MMMM yyyy", { locale: es })
  } catch {
    return null
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-ot-orange hover:text-ot-orange/80 transition-colors cursor-pointer"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  )
}

export function InscripcionContent({
  tournament,
  category,
  teams,
  existingRegistrations,
  paymentConfig,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<TeamSelection[]>([])
  const [activeSelectionIndex, setActiveSelectionIndex] = useState(0)
  const [showWizard, setShowWizard] = useState(existingRegistrations.length === 0)

  // Current selection being edited
  const currentSelection = selections[activeSelectionIndex]
  const currentTeam = teams.find((t) => t.id === currentSelection?.teamId)
  const activeMembers = currentTeam?.members.filter((m) => m.isActive) ?? []

  // Teams not yet selected
  const selectedTeamIds = new Set(selections.map((s) => s.teamId))
  const unselectedTeams = teams.filter((t) => !selectedTeamIds.has(t.id))

  const regStart = formatDate(tournament.registrationStartDate)
  const regEnd = formatDate(tournament.registrationEndDate)

  // --- Step navigation ---
  function canAdvanceFromStep(s: number): boolean {
    if (s === 0) return selections.length > 0
    if (s === 1) {
      return selections.every((sel) => sel.playerIds.length >= MIN_PLAYERS)
    }
    return true
  }

  function handleNext() {
    if (step < 2 && canAdvanceFromStep(step)) setStep(step + 1)
  }

  function handleBack() {
    if (step > 0) setStep(step - 1)
  }

  // --- Team selection (step 0) ---
  function addTeam(teamId: string) {
    const newSelections = [...selections, { teamId, playerIds: [] }]
    setSelections(newSelections)
    setActiveSelectionIndex(newSelections.length - 1)
  }

  function removeTeam(index: number) {
    const newSelections = selections.filter((_, i) => i !== index)
    setSelections(newSelections)
    if (activeSelectionIndex >= newSelections.length) {
      setActiveSelectionIndex(Math.max(0, newSelections.length - 1))
    }
  }

  // --- Player selection (step 1) ---
  function togglePlayer(profileId: string) {
    setSelections((prev) =>
      prev.map((sel, i) => {
        if (i !== activeSelectionIndex) return sel
        const has = sel.playerIds.includes(profileId)
        return {
          ...sel,
          playerIds: has
            ? sel.playerIds.filter((id) => id !== profileId)
            : [...sel.playerIds, profileId],
        }
      }),
    )
  }

  function selectAllPlayers() {
    setSelections((prev) =>
      prev.map((sel, i) => {
        if (i !== activeSelectionIndex) return sel
        const team = teams.find((t) => t.id === sel.teamId)
        const allIds = (team?.members ?? [])
          .filter((m) => m.isActive)
          .map((m) => m.profile.id)
        return { ...sel, playerIds: allIds }
      }),
    )
  }

  function deselectAllPlayers() {
    setSelections((prev) =>
      prev.map((sel, i) => {
        if (i !== activeSelectionIndex) return sel
        return { ...sel, playerIds: [] }
      }),
    )
  }

  // --- Payment calculation ---
  function calculateFees() {
    let totalInscription = 0
    let totalInsurance = 0
    const breakdown: {
      teamName: string
      playerCount: number
      inscription: number
      insurance: number
      total: number
    }[] = []

    for (const sel of selections) {
      const team = teams.find((t) => t.id === sel.teamId)
      const inscription = paymentConfig.inscriptionFee
      const insurance = paymentConfig.insuranceFeePerPlayer * sel.playerIds.length
      totalInscription += inscription
      totalInsurance += insurance
      breakdown.push({
        teamName: team?.name ?? "Equipo",
        playerCount: sel.playerIds.length,
        inscription,
        insurance,
        total: inscription + insurance,
      })
    }

    return { totalInscription, totalInsurance, grandTotal: totalInscription + totalInsurance, breakdown }
  }

  // --- Submit ---
  function handleConfirm() {
    startTransition(async () => {
      const result = await createMultiRegistrationAction(
        {
          tournamentId: tournament.id,
          categoryId: category.id,
          teams: selections.map((s) => ({
            teamId: s.teamId,
            playerIds: s.playerIds,
          })),
        },
        tournament.slug,
        category.slug,
      )
      if (result.success && result.data) {
        toast.success(
          selections.length > 1
            ? `${selections.length} inscripciones enviadas correctamente`
            : "Inscripción enviada correctamente",
        )
        // Redirect to confirmation page for the first registration
        router.push(
          `/torneos/${tournament.slug}/${category.slug}/inscripcion/${result.data.ids[0]}`,
        )
        router.refresh()
      } else {
        toast.error(result.error ?? "No se pudo completar la inscripción")
      }
    })
  }

  const fees = calculateFees()

  return (
    <div className="min-h-screen bg-ot-background text-white">
      {/* Tournament info header */}
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
            href={`/torneos/${tournament.slug}/${category.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-[#a9a5bb] hover:text-ot-orange transition-colors mb-4 font-din-display uppercase"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a la categoría
          </Link>

          <h1 className="text-2xl md:text-3xl font-bold uppercase font-din-display text-ot-orange tracking-tight">
            Inscripción
          </h1>
          <p className="mt-1 text-[#a9a5bb] text-sm md:text-base">
            {tournament.name} &middot; {category.name}
          </p>

          {(regStart || regEnd) && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-sm bg-[#2b161f] px-4 py-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-ot-orange" />
              <span className="text-[#a9a5bb]">
                {regStart && regEnd
                  ? `${regStart} — ${regEnd}`
                  : regStart
                    ? `Desde ${regStart}`
                    : `Hasta ${regEnd}`}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="ot-container py-6 md:py-10 space-y-8">
        {/* Existing registrations */}
        {existingRegistrations.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="h-4 w-4 text-ot-orange" />
              Tus inscripciones en esta categoría
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {existingRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-4 flex items-center gap-3"
                >
                  {reg.team?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reg.team.logoUrl}
                      alt={reg.team.name}
                      className="h-10 w-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base font-bold text-white/40">
                      {reg.team?.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {reg.team?.name ?? "Equipo"}
                    </p>
                    <Link
                      href={`/torneos/${tournament.slug}/${category.slug}/inscripcion/${reg.id}`}
                      className="text-xs text-ot-orange hover:text-ot-orange/80 transition-colors"
                    >
                      Ver estado y pago →
                    </Link>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                      reg.status === "approved"
                        ? "bg-green-500/20 text-green-300 border-green-500/30"
                        : reg.status === "rejected"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/30",
                    )}
                  >
                    {reg.status === "approved" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : reg.status === "rejected" ? (
                      <X className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {reg.status === "approved"
                      ? "Aprobada"
                      : reg.status === "rejected"
                        ? "Rechazada"
                        : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>

            {/* Button to show wizard if hidden */}
            {!showWizard && teams.length > 0 && (
              <button
                type="button"
                onClick={() => setShowWizard(true)}
                className="inline-flex items-center gap-2 text-sm text-ot-orange hover:text-ot-orange/80 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Inscribir otro equipo
              </button>
            )}
          </section>
        )}

        {/* Wizard */}
        {showWizard && (
          <section className="space-y-6">
            {/* No teams available */}
            {teams.length === 0 ? (
              <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 py-10 text-center max-w-lg">
                <AlertCircle className="h-6 w-6 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/50">
                  No tenés equipos disponibles para inscribir.
                </p>
                <p className="mt-1 text-xs text-white/30">
                  {existingRegistrations.length > 0
                    ? "Ya inscribiste todos tus equipos en esta categoría."
                    : "Creá un equipo o pedile al delegado que te agregue."}
                </p>
              </div>
            ) : (
              <>
                {/* Stepper header */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {STEPS.map((s, i) => {
                    const StepIcon = s.icon
                    const isActive = step === i
                    const isCompleted = step > i
                    return (
                      <div key={i} className="flex items-center gap-2 shrink-0">
                        {i > 0 && (
                          <div
                            className={cn(
                              "h-px w-6 sm:w-10",
                              isCompleted ? "bg-ot-orange" : "bg-white/20",
                            )}
                          />
                        )}
                        <button
                          type="button"
                          disabled={i > step}
                          onClick={() => i < step && setStep(i)}
                          className={cn(
                            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
                            isActive
                              ? "bg-ot-orange text-white"
                              : isCompleted
                                ? "bg-ot-orange/20 text-ot-orange"
                                : "bg-white/5 text-white/40",
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <StepIcon className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">{s.label}</span>
                          <span className="sm:hidden">{i + 1}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Step 0: Select teams */}
                {step === 0 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Elegí los equipos a inscribir
                      </h2>
                      <p className="text-sm text-white/50 mt-1">
                        Podés seleccionar uno o varios equipos para inscribirlos de una sola vez.
                      </p>
                    </div>

                    {/* Selected teams */}
                    {selections.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                          Seleccionados ({selections.length})
                        </p>
                        {selections.map((sel, idx) => {
                          const team = teams.find((t) => t.id === sel.teamId)
                          if (!team) return null
                          return (
                            <div
                              key={sel.teamId}
                              className="flex items-center gap-3 rounded-xl border border-ot-orange bg-ot-orange/10 p-3"
                            >
                              {team.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={team.logoUrl}
                                  alt={team.name}
                                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base font-bold text-white/40">
                                  {team.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate">
                                  {team.name}
                                </p>
                                <p className="text-xs text-white/40">
                                  {team.members.filter((m) => m.isActive).length} jugadores
                                  activos
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeTeam(idx)}
                                className="text-white/40 hover:text-red-400 transition-colors cursor-pointer p-1"
                                aria-label={`Quitar ${team.name}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Available teams to add */}
                    {unselectedTeams.length > 0 && (
                      <div className="space-y-2">
                        {selections.length > 0 && (
                          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">
                            Disponibles
                          </p>
                        )}
                        {unselectedTeams.map((team) => (
                          <button
                            key={team.id}
                            type="button"
                            onClick={() => addTeam(team.id)}
                            className="w-full flex items-center gap-3 rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 hover:bg-ot-dark-blue/50 p-4 text-left transition-colors cursor-pointer"
                          >
                            {team.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={team.logoUrl}
                                alt={team.name}
                                className="h-10 w-10 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base font-bold text-white/40">
                                {team.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white">{team.name}</p>
                              <p className="text-xs text-white/40">
                                {team.sport.name} &middot;{" "}
                                {team.members.filter((m) => m.isActive).length} jugadores
                              </p>
                            </div>
                            <Plus className="h-5 w-5 text-white/30 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 1: Select players per team */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Seleccioná los jugadores
                      </h2>
                      <p className="text-sm text-white/50 mt-1">
                        Mínimo {MIN_PLAYERS} jugadores por equipo.
                      </p>
                    </div>

                    {/* Team tabs for multi-team */}
                    {selections.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {selections.map((sel, idx) => {
                          const team = teams.find((t) => t.id === sel.teamId)
                          const isValid = sel.playerIds.length >= MIN_PLAYERS
                          return (
                            <button
                              key={sel.teamId}
                              type="button"
                              onClick={() => setActiveSelectionIndex(idx)}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer shrink-0",
                                activeSelectionIndex === idx
                                  ? "bg-ot-orange/20 text-ot-orange border border-ot-orange/50"
                                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10",
                              )}
                            >
                              {team?.name ?? "Equipo"}
                              {isValid ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                              ) : (
                                <span className="text-xs text-amber-400">
                                  {sel.playerIds.length}/{MIN_PLAYERS}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Player list */}
                    {currentSelection && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white/70">
                            {currentTeam?.name}
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={selectAllPlayers}
                              className="text-xs text-ot-orange hover:text-ot-orange/80 transition-colors cursor-pointer"
                            >
                              Seleccionar todos
                            </button>
                            <button
                              type="button"
                              onClick={deselectAllPlayers}
                              className="text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                            >
                              Limpiar
                            </button>
                          </div>
                        </div>

                        {activeMembers.length === 0 ? (
                          <p className="text-sm text-white/40 py-4">
                            Este equipo no tiene jugadores activos.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {activeMembers.map((member) => {
                              const checked = currentSelection.playerIds.includes(
                                member.profile.id,
                              )
                              return (
                                <label
                                  key={member.profile.id}
                                  className={cn(
                                    "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors",
                                    checked
                                      ? "border-ot-orange/50 bg-ot-orange/10"
                                      : "border-ot-light-blue/30 bg-white/3 hover:bg-white/5",
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => togglePlayer(member.profile.id)}
                                    className="accent-ot-orange h-4 w-4 shrink-0"
                                  />
                                  {member.profile.avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={member.profile.avatarUrl}
                                      alt={member.profile.name}
                                      className="h-8 w-8 rounded-full object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/40">
                                      {member.profile.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="text-sm text-white">
                                    {member.profile.name}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        )}

                        <p className="text-xs text-white/40">
                          {currentSelection.playerIds.length} jugador
                          {currentSelection.playerIds.length !== 1 ? "es" : ""}{" "}
                          seleccionado
                          {currentSelection.playerIds.length !== 1 ? "s" : ""}
                          {currentSelection.playerIds.length < MIN_PLAYERS && (
                            <span className="text-amber-400">
                              {" "}
                              (mínimo {MIN_PLAYERS} requeridos)
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Payment summary */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Resumen de inscripción
                      </h2>
                      <p className="text-sm text-white/50 mt-1">
                        Revisá el detalle antes de confirmar.
                      </p>
                    </div>

                    {/* Breakdown per team */}
                    <div className="space-y-3">
                      {fees.breakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-4 space-y-2"
                        >
                          <p className="font-semibold text-white">{item.teamName}</p>
                          <div className="grid grid-cols-2 gap-1 text-sm">
                            <span className="text-white/50">Inscripción</span>
                            <span className="text-white text-right">
                              ${item.inscription.toLocaleString("es-AR")}
                            </span>
                            <span className="text-white/50">
                              Seguro ({item.playerCount} jugadores)
                            </span>
                            <span className="text-white text-right">
                              ${item.insurance.toLocaleString("es-AR")}
                            </span>
                          </div>
                          <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-semibold">
                            <span className="text-white/70">Subtotal</span>
                            <span className="text-white">
                              ${item.total.toLocaleString("es-AR")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Grand total */}
                    <div className="rounded-xl border border-ot-orange/50 bg-ot-orange/10 p-4 flex justify-between items-center">
                      <span className="text-white font-semibold">Total a pagar</span>
                      <span className="text-2xl font-bold text-ot-orange font-din-display">
                        ${fees.grandTotal.toLocaleString("es-AR")}
                      </span>
                    </div>

                    {/* Payment info preview */}
                    <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-4 space-y-3">
                      <p className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                        Datos de pago
                      </p>
                      <p className="text-xs text-white/40">
                        Una vez confirmada la inscripción, te mostraremos los datos
                        completos para realizar el pago.
                      </p>

                      {paymentConfig.paymentMethods.transfer.enabled && (
                        <div className="space-y-1 text-sm">
                          <p className="text-white/50">Transferencia bancaria</p>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium font-mono">
                              {paymentConfig.paymentMethods.transfer.alias}
                            </span>
                            <CopyButton
                              text={paymentConfig.paymentMethods.transfer.alias}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={isPending}
                      className="border border-white/30 text-white/70 hover:text-white rounded-lg px-5 py-2.5 text-sm transition-colors cursor-pointer"
                    >
                      Atrás
                    </button>
                  )}

                  {step < 2 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canAdvanceFromStep(step)}
                      className="bg-ot-orange hover:bg-ot-orange/90 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={isPending}
                      className="bg-ot-orange hover:bg-ot-orange/90 text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
                    >
                      {isPending ? "Procesando..." : "Confirmar inscripción"}
                      {!isPending && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                  )}

                  {step === 0 && existingRegistrations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowWizard(false)
                        setSelections([])
                        setStep(0)
                      }}
                      className="text-sm text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
