import { notFound } from 'next/navigation'
import { Shield, Star, Users, Trophy, Pencil, UserPlus, Trash2 } from 'lucide-react'
import teamService from '@/modules/team/TeamService'
import { getProfile } from '@/lib/auth/session'
import { hasAdminRole } from '@/lib/auth/hasAdminRole'
import { BackButton } from './BackButton'

interface Member {
  id: string
  isActive: boolean
  joinedAt: string
  profile: {
    id: string
    name: string
    email?: string
    avatarUrl?: string
  }
}

interface TeamZone {
  zone: {
    name: string
    category: {
      name: string
      tournament: { name: string }
    }
  }
}

interface TeamDetail {
  id: string
  name: string
  logoUrl?: string
  captainId?: string
  creatorId: string
  sport: { name: string }
  creator: { id: string; name: string; email: string }
  captain?: { id: string; name: string; avatarUrl?: string }
  members: Member[]
  teamZones: TeamZone[]
}

async function getTeam(id: string): Promise<TeamDetail | null> {
  try {
    const res = await teamService.getTeamById(id)
    return res?.data ?? res
  } catch {
    return null
  }
}

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [team, profile] = await Promise.all([getTeam(id), getProfile()])

  if (!team) notFound()

  const activeMembers = team.members.filter((m) => m.isActive)
  const captain = team.captain

  const isAdmin = profile ? hasAdminRole(profile) : false
  const isCreator = profile?.id === team.creatorId
  const isCaptain = profile?.id === team.captainId
  const canEdit = isAdmin || isCreator
  const canManagePlayers = isAdmin || isCreator || isCaptain

  return (
    <div className="space-y-6">
      {/* Back */}
      <BackButton />

      {/* Header card */}
      <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-6">
        <div className="flex items-start gap-5">
          {team.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.logoUrl}
              alt={team.name}
              className="h-20 w-20 rounded-2xl object-cover shrink-0 ring-2 ring-white/10"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-3xl font-bold text-white/30 ring-2 ring-white/10">
              {team.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-white truncate">{team.name}</h1>
                <p className="mt-1 text-sm text-white/50">{team.sport.name}</p>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <Users className="h-3.5 w-3.5" />
                    {activeMembers.length} {activeMembers.length === 1 ? 'jugador' : 'jugadores'}
                  </span>
                  {team.teamZones.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-white/40">
                      <Trophy className="h-3.5 w-3.5" />
                      {team.teamZones.length} {team.teamZones.length === 1 ? 'zona' : 'zonas'}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions based on role */}
              {(canEdit || canManagePlayers) && (
                <div className="flex items-center gap-2 shrink-0">
                  {canManagePlayers && (
                    <button className="flex items-center gap-1.5 rounded-lg border border-ot-light-blue/50 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5 transition-colors">
                      <UserPlus className="h-3.5 w-3.5" />
                      Agregar jugador
                    </button>
                  )}
                  {canEdit && (
                    <button className="flex items-center gap-1.5 rounded-lg border border-ot-light-blue/50 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  )}
                  {isAdmin && (
                    <button className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400/70 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Captain */}
      {captain && (
        <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider">
            <Star className="h-4 w-4 text-ot-orange" />
            Delegado
          </h2>
          <div className="flex items-center gap-3">
            {captain.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={captain.avatarUrl}
                alt={captain.name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-ot-orange/30"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ot-orange/20 text-sm font-bold text-ot-orange">
                {captain.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-white">{captain.name}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-ot-orange/20 px-2 py-0.5 text-[10px] font-semibold text-ot-orange">
                <Star className="h-2.5 w-2.5" />
                Delegado
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider">
          <Users className="h-4 w-4 text-ot-orange" />
          Jugadores ({activeMembers.length})
        </h2>

        {activeMembers.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
              <Shield className="h-5 w-5 text-white/20" />
            </div>
            <p className="text-sm text-white/40">No hay jugadores registrados</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activeMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-white/4 transition-colors group"
              >
                {member.profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.profile.avatarUrl}
                    alt={member.profile.name}
                    className="h-9 w-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">
                    {member.profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{member.profile.name}</p>
                    {member.profile.id === team.captainId && (
                      <span className="flex items-center gap-1 rounded-full bg-ot-orange/20 px-1.5 py-0.5 text-[9px] font-semibold text-ot-orange shrink-0">
                        <Star className="h-2 w-2" />
                        Delegado
                      </span>
                    )}
                    {member.profile.id === team.creatorId && member.profile.id !== team.captainId && (
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-white/40 shrink-0">
                        Creador
                      </span>
                    )}
                  </div>
                  {member.profile.email && (
                    <p className="text-xs text-white/30 truncate">{member.profile.email}</p>
                  )}
                </div>

                {/* Per-member actions for captain/creator/admin */}
                {canManagePlayers && member.profile.id !== team.creatorId && (
                  <button className="hidden group-hover:flex items-center gap-1 text-[11px] text-red-400/60 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 className="h-3 w-3" />
                    Quitar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tournament zones */}
      {team.teamZones.length > 0 && (
        <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider">
            <Trophy className="h-4 w-4 text-ot-orange" />
            Participación en torneos
          </h2>
          <div className="space-y-2">
            {team.teamZones.map((tz, i) => (
              <div key={i} className="rounded-lg border border-ot-light-blue/30 p-3">
                <p className="text-sm font-medium text-white">{tz.zone.category.tournament.name}</p>
                <p className="mt-0.5 text-xs text-white/50">
                  {tz.zone.category.name} · {tz.zone.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
