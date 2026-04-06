import { hasAdminRole } from '@/lib/auth/hasAdminRole'
import { getProfile } from '@/lib/auth/session'
import { getMockTeamMatches, MatchPreview } from '@/modules/common/components/MatchPreview'
import { getMockPlayerStats, getMockTeamStats } from '@/modules/team/mock/playerStats.mock'
import teamService from '@/modules/team/TeamService'
import { Settings, Star, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AddPlayerDialog } from './AddPlayerDialog'
import { LeaveTeamButton } from './LeaveTeamButton'
import { LogoEditButton } from './LogoEditButton'
import { RemovePlayerButton } from './RemovePlayerButton'

const DEFAULT_PLAYER_PHOTO = '/player-placeholder.png'

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

function avg(total: number, played: number): string {
  if (!played || played === 0) return '-'
  return (total / played).toFixed(1).replace(/\.0$/, '')
}

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [team, profile] = await Promise.all([getTeam(id), getProfile()])

  if (!team) notFound()

  const activeMembers = team.members.filter((m) => m.isActive)

  // TODO: Reemplazar por llamada a API cuando GET /teams/:id/stats esté disponible
  const teamStats = getMockTeamStats(id)
  const playerStats = getMockPlayerStats(id)
  // TODO: Reemplazar por llamada a API cuando GET /teams/:id/matches esté disponible
  const { lastMatch, nextMatch } = getMockTeamMatches(id)

  const isAdmin = profile ? hasAdminRole(profile) : false
  const isCreator = profile?.id === team.creatorId
  const isCaptain = profile?.id === team.captainId
  const isMember = activeMembers.some((m) => m.profile.id === profile?.id)
  const canEdit = isAdmin || isCreator
  // Solo el delegado (capitán) y admin pueden eliminar jugadores
  const canRemovePlayers = isAdmin || isCaptain
  // Mostrar info interna (pill "Delegado") solo a miembros o staff
  const canSeePlatformInfo = isAdmin || isMember

  return (
    <div className="w-full bg-ot-background">

      {/* ── TEAM PHOTO + BADGE ── */}
      <div className="relative bg-ot-background">
        {team.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.logoUrl}
            alt={team.name}
            className="w-full lg:w-132.5 mx-auto object-cover max-h-72"
          />
        ) : (
          <div className="w-full lg:w-132.5 mx-auto h-48 bg-[#181525] flex items-center justify-center">
            <span className="text-8xl font-bold text-white/10">
              {team.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Badge overlaid at bottom center – with optional edit pencil */}
        <div className="left-1/2 -translate-x-1/2 absolute -bottom-14 flex h-28 w-28 items-center justify-center rounded-full bg-[#181525] ring-4 ring-ot-background">
          <div className="relative h-20 w-20">
            {team.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={team.logoUrl}
                alt={team.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-ot-dark-blue flex items-center justify-center">
                <span className="text-4xl font-bold text-white/30">
                  {team.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {canEdit && <LogoEditButton teamId={id} />}
          </div>
        </div>
      </div>

      {/* ── TEAM NAME ── */}
      <div className="bg-ot-background pt-20 flex justify-center">
        <div className="text-center">
          <p className="font-din-display uppercase font-thin text-white text-lg tracking-wide">
            {team.name}
          </p>
          <p className="text-xs text-white/30 uppercase tracking-widest mt-1">
            {team.sport.name}
          </p>
        </div>
      </div>

      {/* ── STAT CARDS (estadísticas del equipo) ── */}
      <div className="flex justify-center mt-10 px-4">
        <div className="grid gap-1 lg:gap-1.5 grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'PROM. PUNTOS\nPOR PARTIDO',
              value: teamStats ? avg(teamStats.pointsFor, teamStats.playedMatches) : '-',
            },
            {
              label: 'PROM. PUNTOS\nRECIBIDOS',
              value: teamStats ? avg(teamStats.pointsAgainst, teamStats.playedMatches) : '-',
            },
            {
              label: 'PARTIDOS\nGANADOS',
              value: teamStats?.won ?? '-',
            },
            {
              label: 'PARTIDOS\nPERDIDOS',
              value: teamStats?.lost ?? '-',
            },
          ].map((stat) => (
            <div key={stat.label} className="w-42.5">
              <div className="bg-ot-light-blue rounded-t-sm py-2 px-2 flex justify-center items-center min-h-[36px] text-[0.58rem] text-center font-din-display">
                <span className="opacity-60 text-white uppercase whitespace-pre-line leading-tight">
                  {stat.label}
                </span>
              </div>
              <div className="bg-ot-dark-blue rounded-b-sm py-2 flex justify-center items-center text-ot-orange text-3xl text-center font-din-display font-bold">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MATCHES ── */}
      {(lastMatch || nextMatch) && (
        <div className="flex flex-wrap justify-center gap-12 bg-ot-background px-4 pt-12">
          {lastMatch && (
            <div className="flex flex-col gap-3 items-center">
              <span className="text-ot-orange text-sm text-center font-din-display font-bold uppercase tracking-wider">
                Último partido
              </span>
              <MatchPreview match={lastMatch} />
            </div>
          )}
          {nextMatch && (
            <div className="flex flex-col gap-3 items-center">
              <span className="text-ot-orange text-sm text-center font-din-display font-bold uppercase tracking-wider">
                Próximo partido
              </span>
              <MatchPreview match={nextMatch} />
            </div>
          )}
        </div>
      )}

      {/* ── TEAM ACTIONS ── */}
      <div className="flex justify-center gap-3 mt-6 px-4 flex-wrap">
        {(isAdmin || isCreator || isCaptain) && (
          <Link
            href={`/equipos/${id}/gestionar`}
            className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            Gestionar equipo
          </Link>
        )}
        {isMember && !isCreator && <LeaveTeamButton teamId={id} />}
      </div>

      {/* ── PLAYERS LIST ── */}
      <div className="flex flex-col items-center gap-3 my-12 bg-ot-background">
        <span className="text-ot-orange text-sm text-center font-din-display font-bold uppercase tracking-wider">
          Lista de jugadores
        </span>

        <div className="p-2 flex flex-col gap-4">
          <div className="p-1 w-full rounded-md max-w-sm">

            {/* Table header */}
            <div className="text-white flex items-center text-[0.65rem] font-bold py-2 rounded-t-md font-din-display bg-ot-light-blue">
              <div className="w-1/3" />
              <div className="uppercase pl-3">jugador</div>
            </div>

            {activeMembers.length === 0 ? (
              <div className="bg-[#181525] rounded-b-md py-10 text-center">
                <p className="text-sm text-white/30">Sin jugadores registrados</p>
              </div>
            ) : (
              activeMembers.map((member, index) => {
                const isLast = index === activeMembers.length - 1
                const isMemberCaptain = member.profile.id === team.captainId
                const isMemberCreator = member.profile.id === team.creatorId
                const stats = playerStats[member.profile.id]
                const photoSrc = stats?.picture ?? DEFAULT_PLAYER_PHOTO

                return (
                  <div
                    key={member.id}
                    className={`flex w-full bg-[#181525] ${isLast ? 'rounded-br-md' : ''}`}
                  >
                    {/* Player photo */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoSrc}
                      alt={member.profile.name}
                      className={`w-1/3 object-cover z-10 ${isLast ? 'rounded-bl-md' : ''}`}
                    />

                    {/* Right side */}
                    <div className="flex-1 flex flex-col">

                      {/* Name + role + PJ */}
                      <div className="flex w-full gap-3 px-3 py-2 h-10">
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-1.5">
                            <span className="font-din-display text-xs text-white ml-1 leading-tight">
                              {member.profile.name}
                            </span>
                            {/* Pill "Delegado" solo visible para miembros y staff */}
                            {canSeePlatformInfo && isMemberCaptain && (
                              <span className="flex items-center gap-0.5 rounded-full bg-ot-orange/20 px-1.5 py-0.5 text-[9px] font-bold text-ot-orange shrink-0">
                                <Star className="h-2 w-2" />
                                Del.
                              </span>
                            )}
                            {canSeePlatformInfo && isMemberCreator && !isMemberCaptain && (
                              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-white/40 shrink-0">
                                Del.
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-[#4E4585] text-xs">
                              <span className="font-din-display mr-1">{stats?.played ?? '-'}</span>
                              <span className="font-din-display font-bold">PJ</span>
                            </div>
                            {/* Eliminar jugador: solo capitán y admin */}
                            {canRemovePlayers && !isMemberCreator && (
                              <RemovePlayerButton
                                teamId={id}
                                profileId={member.profile.id}
                                playerName={member.profile.name}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats row 1: P.PTS / P.TL / P.TC 2P / P.TC 3P */}
                      <div
                        className="flex h-full"
                        style={{ background: 'linear-gradient(90deg, rgba(59,51,106,0.2) 0%, #181525 100%)' }}
                      >
                        <div className="flex flex-col justify-center items-center py-1 w-1/4 text-[0.60rem] relative">
                          <div className="uppercase font-din-display font-bold z-10 text-[#4E4585]">p.pts</div>
                          <div className="font-din-display opacity-80 z-10 text-white">
                            {avg(stats?.points ?? 0, stats?.played ?? 0)}
                          </div>
                          <div
                            className="pts absolute w-[150%] h-full top-0 -left-7 z-0"
                            style={{ background: 'linear-gradient(90deg, #181525 0%, rgba(59,51,106,0.2) 100%)' }}
                          />
                        </div>
                        <div className="text-[0.60rem] flex flex-1">
                          {[
                            { label: 'P.TL', value: avg(stats?.pt1 ?? 0, stats?.played ?? 0) },
                            { label: 'P.TC 2P', value: avg(stats?.pt2 ?? 0, stats?.played ?? 0) },
                            { label: 'P.TC 3P', value: avg(stats?.pt3 ?? 0, stats?.played ?? 0) },
                          ].map((s) => (
                            <div key={s.label} className="flex flex-col justify-center items-center py-1 w-1/3">
                              <div className="uppercase font-din-display font-bold text-[#4E4585]">{s.label}</div>
                              <div className="font-din-display opacity-80 text-white">{s.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Stats row 2: P.FAL / P.ROB / P.REB / P.AS */}
                      <div
                        className={`flex h-full ${isLast ? 'rounded-br-md' : ''}`}
                        style={{ background: 'linear-gradient(90deg, #181525 0%, rgba(59,51,106,0.2) 100%)' }}
                      >
                        <div className="text-[0.60rem] flex flex-1">
                          {[
                            { label: 'p.fal', value: avg(stats?.fouls ?? 0, stats?.played ?? 0) },
                            { label: 'p.rob', value: avg(stats?.steals ?? 0, stats?.played ?? 0) },
                            { label: 'p.reb', value: avg(stats?.rebounds ?? 0, stats?.played ?? 0) },
                            { label: 'p.as', value: avg(stats?.assists ?? 0, stats?.played ?? 0) },
                          ].map((s) => (
                            <div key={s.label} className="flex flex-col justify-center items-center py-1 px-2 w-1/4">
                              <div className="uppercase font-din-display font-bold text-[#4E4585]">{s.label}</div>
                              <div className="font-din-display opacity-80 text-white">{s.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Agregar jugador – solo delegado y admin */}
          {(isAdmin || isCaptain) && (
            <div className="w-full max-w-sm">
              <AddPlayerDialog
                teamId={id}
                trigger={
                  <button className="flex items-center justify-center gap-1.5 w-full rounded border border-blue-500/40 bg-blue-500/10 px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide text-blue-400 hover:bg-blue-500/20 transition-colors font-din-display cursor-pointer">
                    <UserPlus className="h-3.5 w-3.5" />
                    Agregar jugador
                  </button>
                }
              />
            </div>
          )}

          {/* Stats legend */}
          <p className="text-[0.68rem] text-center font-din-display px-2 max-w-sm">
            <span className="opacity-70 text-white"> PJ: </span><span className="opacity-50 text-white">Partidos Jugados </span>
            <span className="opacity-70 text-white"> P.PTS</span><span className="opacity-50 text-white">: Prom. Puntos - </span>
            <span className="opacity-70 text-white">P.TL</span><span className="opacity-50 text-white">: Prom. Tiros Libres - </span>
            <br />
            <span className="opacity-70 text-white">P.TC 2P</span><span className="opacity-50 text-white">: Tiros Campo Doble - </span>
            <span className="opacity-70 text-white">P.TC 3P</span><span className="opacity-50 text-white">: Tiros Campo Triple - </span>
            <span className="opacity-70 text-white">P.FAL: </span><span className="opacity-50 text-white">Prom. Faltas - </span>
            <span className="opacity-70 text-white">P.ROB: </span><span className="opacity-50 text-white">Prom. Robos - </span>
            <span className="opacity-70 text-white">P.REB: </span><span className="opacity-50 text-white">Prom. Rebotes - </span>
            <span className="opacity-70 text-white">P.ASIS</span><span className="opacity-50 text-white">: Prom. Asistencias</span>
          </p>


        </div>
      </div>

      {/* ── TOURNAMENT ZONES ── */}
      {team.teamZones.length > 0 && (
        <div className="flex flex-col items-center gap-3 pb-16 bg-ot-background">
          <span className="text-ot-orange text-sm text-center font-din-display font-bold uppercase tracking-wider">
            Participación en torneos
          </span>
          <div className="w-full max-w-sm px-2 space-y-2">
            {team.teamZones.map((tz, i) => (
              <div key={i} className="rounded-sm overflow-hidden">
                <div className="bg-ot-light-blue px-4 py-1.5">
                  <p className="text-[0.58rem] uppercase text-white/60 font-din-display">
                    {tz.zone.category.tournament.name}
                  </p>
                </div>
                <div className="bg-ot-dark-blue px-4 py-2">
                  <p className="text-xs text-white/80 font-din-display">
                    {tz.zone.category.name} · {tz.zone.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
