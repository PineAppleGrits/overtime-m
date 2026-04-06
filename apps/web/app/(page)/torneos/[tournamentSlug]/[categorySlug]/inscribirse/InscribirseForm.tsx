"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { createRegistrationWithPlayersAction } from "@/modules/registration/actions/registrationActions"

type TeamMember = {
  profile: { id: string; name: string; avatarUrl?: string }
  isActive: boolean
}

type MyTeam = {
  id: string
  name: string
  logoUrl?: string | null
  sport: { name: string }
  members: TeamMember[]
}

type Props = {
  tournamentId: string
  categoryId: string
  categorySlug: string
  tournamentSlug: string
  initialTeams: MyTeam[]
}

export function InscribirseForm({
  tournamentId,
  categoryId,
  categorySlug,
  tournamentSlug,
  initialTeams,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])

  const selectedTeam = initialTeams.find((t) => t.id === selectedTeamId)
  const activeMembers = selectedTeam?.members.filter((m) => m.isActive) ?? []

  function togglePlayer(profileId: string) {
    setSelectedPlayerIds((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    )
  }

  const MIN_PLAYERS = 8

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTeamId || selectedPlayerIds.length < MIN_PLAYERS) return
    startTransition(async () => {
      const result = await createRegistrationWithPlayersAction(
        { teamId: selectedTeamId, tournamentId, categoryId, playerIds: selectedPlayerIds },
        tournamentSlug,
        categorySlug,
      )
      if (result.success) {
        toast.success("¡Inscripción enviada! Quedá pendiente de aprobación.")
        router.push(`/torneos/${tournamentSlug}/${categorySlug}`)
        router.refresh()
      } else {
        toast.error(result.error ?? "No se pudo completar la inscripción")
      }
    })
  }

  if (initialTeams.length === 0) {
    return (
      <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 py-10 text-center max-w-lg">
        <AlertCircle className="h-6 w-6 text-white/20 mx-auto mb-2" />
        <p className="text-sm text-white/50">No tenés equipos para inscribir.</p>
        <p className="mt-1 text-xs text-white/30">
          Creá un equipo o pedile al delegado que te agregue.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-lg">
      {/* Paso 1: Elegir equipo */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          1. Elegí tu equipo
        </h2>
        <div className="space-y-2">
          {initialTeams.map((team) => {
            const selected = selectedTeamId === team.id
            return (
              <button
                key={team.id}
                type="button"
                onClick={() => {
                  setSelectedTeamId(team.id)
                  setSelectedPlayerIds([])
                }}
                className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                  selected
                    ? "border-ot-orange bg-ot-orange/10"
                    : "border-ot-light-blue/50 bg-ot-dark-blue/30 hover:bg-ot-dark-blue/50"
                }`}
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
                    {team.sport.name} · {team.members.filter((m) => m.isActive).length} jugadores
                  </p>
                </div>
                {selected && <CheckCircle2 className="h-5 w-5 text-ot-orange shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Paso 2: Seleccionar jugadores */}
      {selectedTeam && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            2. Seleccioná los jugadores que participarán
          </h2>
          {activeMembers.length === 0 ? (
            <p className="text-sm text-white/40">Este equipo no tiene jugadores activos.</p>
          ) : (
            <div className="space-y-2">
              {activeMembers.map((member) => {
                const checked = selectedPlayerIds.includes(member.profile.id)
                return (
                  <label
                    key={member.profile.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      checked
                        ? "border-ot-orange/50 bg-ot-orange/10"
                        : "border-ot-light-blue/30 bg-white/3 hover:bg-white/5"
                    }`}
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
                    <span className="text-sm text-white">{member.profile.name}</span>
                  </label>
                )
              })}
            </div>
          )}
          <p className="text-xs text-white/40">
            {selectedPlayerIds.length}{" "}
            jugador{selectedPlayerIds.length !== 1 ? "es" : ""} seleccionado
            {selectedPlayerIds.length !== 1 ? "s" : ""}{" "}
            {selectedPlayerIds.length < MIN_PLAYERS && (
              <span className="text-amber-400">
                (mínimo {MIN_PLAYERS} requeridos)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!selectedTeamId || selectedPlayerIds.length < MIN_PLAYERS || isPending}
          className="bg-ot-orange hover:bg-ot-orange/90 text-white font-semibold rounded-lg px-6 py-3 text-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Enviando..." : "Enviar inscripción"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => router.push(`/torneos/${tournamentSlug}/${categorySlug}`)}
          className="border border-white/30 text-white/70 hover:text-white rounded-lg px-6 py-3 text-sm transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
