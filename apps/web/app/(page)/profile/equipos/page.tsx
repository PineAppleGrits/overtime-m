import Link from 'next/link'
import { Plus, Shield, Users, Star } from 'lucide-react'
import teamService from '@/modules/team/TeamService'

interface TeamMember {
  profile: { id: string; name: string; avatarUrl?: string }
}

interface MyTeam {
  id: string
  name: string
  logoUrl?: string
  captainId?: string
  creatorId: string
  sport: { name: string }
  members: TeamMember[]
}

async function getMyTeams(): Promise<MyTeam[]> {
  try {
    const res = await teamService.getMyTeams()
    return Array.isArray(res) ? res : (res?.data ?? [])
  } catch {
    return []
  }
}

export default async function ProfileTeamsPage() {
  const teams = await getMyTeams()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Users className="h-5 w-5 text-ot-orange" />
            Mis equipos
          </h2>
          <p className="mt-0.5 text-sm text-white/50">
            Equipos que administrás o en los que participás.
          </p>
        </div>
        <Link
          href="/profile/equipos/nuevo"
          className="flex items-center gap-2 rounded-lg bg-ot-orange px-4 py-2 text-sm font-semibold text-white hover:bg-ot-orange/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Crear equipo
        </Link>
      </div>

      {/* Team list or empty state */}
      {teams.length === 0 ? (
        <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
            <Shield className="h-6 w-6 text-white/20" />
          </div>
          <p className="text-sm font-medium text-white/50">No tenés equipos todavía</p>
          <p className="mt-1 text-xs text-white/30">
            Creá tu primer equipo o pedile a un delegado que te agregue.
          </p>
          <Link
            href="/profile/equipos/nuevo"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-ot-orange/40 px-4 py-2 text-sm text-ot-orange hover:bg-ot-orange/10 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Crear equipo
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/equipos/${team.id}`}
              className="flex items-center gap-4 rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-4 hover:border-ot-light-blue hover:bg-ot-dark-blue/50 transition-colors block"
            >
              {/* Logo */}
              {team.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="h-12 w-12 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/8 text-lg font-bold text-white/40">
                  {team.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white truncate">{team.name}</p>
                  {team.captainId && (
                    <span className="flex items-center gap-1 rounded-full bg-ot-orange/20 px-2 py-0.5 text-[10px] font-semibold text-ot-orange">
                      <Star className="h-2.5 w-2.5" />
                      Delegado
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-0.5">{team.sport.name}</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {team.members.length} {team.members.length === 1 ? 'jugador' : 'jugadores'}
                </p>
              </div>

              {/* Avatars */}
              {team.members.length > 0 && (
                <div className="flex -space-x-2 shrink-0">
                  {team.members.slice(0, 4).map((m) => (
                    m.profile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={m.profile.id}
                        src={m.profile.avatarUrl}
                        alt={m.profile.name}
                        title={m.profile.name}
                        className="h-7 w-7 rounded-full border-2 border-[#0d0c14] object-cover"
                      />
                    ) : (
                      <div
                        key={m.profile.id}
                        title={m.profile.name}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0d0c14] bg-white/15 text-[10px] font-semibold text-white/70"
                      >
                        {m.profile.name.charAt(0).toUpperCase()}
                      </div>
                    )
                  ))}
                  {team.members.length > 4 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0d0c14] bg-white/10 text-[10px] font-semibold text-white/50">
                      +{team.members.length - 4}
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
