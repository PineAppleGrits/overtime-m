import { MatchDetailContent } from '@/modules/admin/components/torneos/MatchDetailContent'
import { MatchStatsSection } from '@/modules/admin/components/torneos/MatchStatsSection'
import matchService from '@/modules/match/MatchService'
import playerStatsService from '@/modules/match/PlayerStatsService'
import teamService from '@/modules/team/TeamService'
import type { MatchPlayerStatRow } from '@/modules/match/PlayerStatsService'

interface TeamWithMembers {
  id: string
  name: string
  members: { profileId: string; name: string; avatarUrl: string | null }[]
}

interface ApiTeamMember {
  profileId?: string
  isActive?: boolean
  profile?: { id: string; name: string; avatarUrl?: string | null } | null
}

interface ApiTeamResponse {
  id: string
  name: string
  members?: ApiTeamMember[]
}

async function fetchTeamRoster(teamId: string | null | undefined): Promise<TeamWithMembers | null> {
  if (!teamId) return null
  try {
    const raw = await teamService.getTeamById(teamId)
    const team = (raw?.data ?? raw) as ApiTeamResponse | null
    if (!team) return null
    const members = (team.members ?? [])
      .filter((m) => m.isActive !== false && m.profile)
      .map((m) => ({
        profileId: m.profile!.id,
        name: m.profile!.name,
        avatarUrl: m.profile!.avatarUrl ?? null,
      }))
    return { id: team.id, name: team.name, members }
  } catch (error) {
    console.error('Failed to fetch team roster:', error)
    return null
  }
}

async function fetchInitialStats(matchId: string): Promise<MatchPlayerStatRow[]> {
  try {
    return await playerStatsService.listByMatch(matchId)
  } catch (error) {
    console.error('Failed to fetch match player stats:', error)
    return []
  }
}

export default async function AdminMatchDetailPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>
}) {
  const { id, matchId } = await params

  // Cargar el match real para conocer homeTeamId/awayTeamId. Si falla, dejamos
  // que MatchStatsSection muestre vacío y MatchDetailContent siga con su mock
  // visual hasta que el resto del detalle se conecte.
  const [matchResult, initialStats] = await Promise.all([
    matchService.getMatchById(matchId).catch((error) => {
      console.error('Failed to fetch match:', error)
      return null
    }),
    fetchInitialStats(matchId),
  ])

  const m = matchResult?.data ?? matchResult
  const homeTeamId: string | null = m?.homeTeamId ?? m?.homeTeam?.id ?? null
  const awayTeamId: string | null = m?.awayTeamId ?? m?.awayTeam?.id ?? null

  const [homeTeam, awayTeam] = await Promise.all([
    fetchTeamRoster(homeTeamId),
    fetchTeamRoster(awayTeamId),
  ])

  return (
    <div className="space-y-8">
      <MatchDetailContent tournamentId={id} matchId={matchId} />

      <MatchStatsSection
        matchId={matchId}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        initialStats={initialStats}
      />
    </div>
  )
}
