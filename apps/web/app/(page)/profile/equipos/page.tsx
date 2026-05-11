import Link from 'next/link'
import { Plus, Shield, Users, Star, Building2, Settings } from 'lucide-react'
import teamService from '@/modules/team/TeamService'
import { getProfile } from '@/lib/auth/session'
import { LeaveTeamButton } from '@/modules/team/components/LeaveTeamButton'

interface TeamMember {
  profile: { id: string; name: string; avatarUrl?: string }
}

interface Franchise {
  id: string
  name: string
  logoUrl?: string
}

interface MyTeam {
  id: string
  name: string
  logoUrl?: string
  captainId?: string
  creatorId: string
  sport: { name: string }
  members: TeamMember[]
  franchise?: Franchise | null
}

async function getMyTeams(): Promise<MyTeam[]> {
  try {
    const res = await teamService.getMyTeams()
    return Array.isArray(res) ? res : (res?.data ?? [])
  } catch {
    return []
  }
}

function TeamCard({
  team,
  profileId,
  compact = false,
}: {
  team: MyTeam
  profileId?: string
  compact?: boolean
}) {
  const isCreator = profileId === team.creatorId
  const isCaptain = profileId === team.captainId

  return (
    <div className={`rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 ${compact ? 'ml-4 border-l-2 border-l-ot-orange/30' : ''}`}>
      <Link
        href={`/equipos/${team.id}`}
        className="flex items-center gap-4 p-4 hover:bg-ot-dark-blue/50 transition-colors rounded-xl"
      >
        {/* Logo */}
        {team.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.logoUrl}
            alt={team.name}
            className="size-12 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/8 text-lg font-bold text-white/40">
            {team.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white truncate">{team.name}</p>
            {isCaptain && (
              <span className="flex items-center gap-1 rounded-full bg-ot-orange/20 px-2 py-0.5 text-[10px] font-semibold text-ot-orange">
                <Star className="size-2.5" />
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
            {team.members.slice(0, 4).map((m) =>
              m.profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.profile.id}
                  src={m.profile.avatarUrl}
                  alt={m.profile.name}
                  title={m.profile.name}
                  className="size-7 rounded-full border-2 border-[#0d0c14] object-cover"
                />
              ) : (
                <div
                  key={m.profile.id}
                  title={m.profile.name}
                  className="flex size-7 items-center justify-center rounded-full border-2 border-[#0d0c14] bg-white/15 text-[10px] font-semibold text-white/70"
                >
                  {m.profile.name.charAt(0).toUpperCase()}
                </div>
              )
            )}
            {team.members.length > 4 && (
              <div className="flex size-7 items-center justify-center rounded-full border-2 border-[#0d0c14] bg-white/10 text-[10px] font-semibold text-white/50">
                +{team.members.length - 4}
              </div>
            )}
          </div>
        )}
      </Link>

      {(isCreator || isCaptain) && (
        <div className="px-4 pb-3 pt-0">
          <Link
            href={`/equipos/${team.id}/gestionar`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ot-light-blue/40 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
          >
            <Settings className="size-3" />
            Gestionar
          </Link>
        </div>
      )}

      {!isCreator && (
        <div className="px-4 pb-3 pt-0">
          <LeaveTeamButton teamId={team.id} compact />
        </div>
      )}
    </div>
  )
}

export default async function ProfileTeamsPage() {
  const [teams, profile] = await Promise.all([getMyTeams(), getProfile()])

  const standaloneTeams = teams.filter((t) => !t.franchise)
  const franchiseTeams = teams.filter((t) => t.franchise)

  // Group franchise teams by franchise id
  const franchiseGroups = franchiseTeams.reduce<
    Record<string, { franchise: Franchise; teams: MyTeam[] }>
  >((acc, team) => {
    const f = team.franchise!
    if (!acc[f.id]) acc[f.id] = { franchise: f, teams: [] }
    acc[f.id].teams.push(team)
    return acc
  }, {})

  const hasAnyTeam = teams.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Users className="size-5 text-ot-orange" />
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
          <Plus className="size-4" />
          Crear equipo
        </Link>
      </div>

      {!hasAnyTeam ? (
        <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 py-14 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/5">
            <Shield className="size-6 text-white/20" />
          </div>
          <p className="text-sm font-medium text-white/50">No tenés equipos todavía</p>
          <p className="mt-1 text-xs text-white/30">
            Creá tu primer equipo o pedile a un delegado que te agregue.
          </p>
          <Link
            href="/profile/equipos/nuevo"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-ot-orange/40 px-4 py-2 text-sm text-ot-orange hover:bg-ot-orange/10 transition-colors"
          >
            <Plus className="size-4" />
            Crear equipo
          </Link>
        </div>
      ) : (
        <>
          {/* Franquicias */}
          {Object.values(franchiseGroups).length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider">
                <Building2 className="size-4" />
                Franquicias
              </h3>
              <div className="space-y-4">
                {Object.values(franchiseGroups).map(({ franchise, teams: fTeams }) => (
                  <div key={franchise.id} className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/20 p-4 space-y-3">
                    {/* Franchise header */}
                    <div className="flex items-center gap-3">
                      {franchise.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={franchise.logoUrl}
                          alt={franchise.name}
                          className="size-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ot-orange/20 text-base font-bold text-ot-orange">
                          {franchise.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white">{franchise.name}</p>
                        <p className="text-xs text-white/40">
                          {fTeams.length} {fTeams.length === 1 ? 'equipo' : 'equipos'}
                        </p>
                      </div>
                    </div>

                    {/* Sub-teams */}
                    <div className="space-y-2">
                      {fTeams.map((team) => (
                        <TeamCard key={team.id} team={team} profileId={profile?.id} compact />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipos individuales */}
          {standaloneTeams.length > 0 && (
            <div className="space-y-3">
              {franchiseGroups && Object.values(franchiseGroups).length > 0 && (
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider">
                  <Shield className="size-4" />
                  Equipos independientes
                </h3>
              )}
              <div className="space-y-3">
                {standaloneTeams.map((team) => (
                  <TeamCard key={team.id} team={team} profileId={profile?.id} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
