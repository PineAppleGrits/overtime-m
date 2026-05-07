import { client } from '../common/client/baseClient'
import { Service } from '../common/services/Service'

/** Una entrada del payload de upsert. Se alinea con el Zod del BE. */
export interface MatchPlayerStatInput {
  profileId: string
  teamId: string
  pt1?: number
  pt1Att?: number
  pt2?: number
  pt2Att?: number
  pt3?: number
  pt3Att?: number
  fouls?: number
  steals?: number
  rebounds?: number
  assists?: number
  turnovers?: number
  blocks?: number
}

/** Una fila ya cargada (lo que devuelve GET /matches/:id/player-stats). */
export interface MatchPlayerStatRow {
  id: string
  profileId: string
  profileName: string
  profileAvatarUrl: string | null
  teamId: string
  pt1: number
  pt1Att: number
  pt2: number
  pt2Att: number
  pt3: number
  pt3Att: number
  fouls: number
  steals: number
  rebounds: number
  assists: number
  turnovers: number
  blocks: number
  points: number
  updatedAt: string
}

export interface TeamStatsResponse {
  playedMatches: number
  won: number
  lost: number
  pointsFor: number
  pointsAgainst: number
}

export interface TeamPlayerStatRow {
  profileId: string
  profileName: string
  profileAvatarUrl: string | null
  teamId: string
  played: number
  points: number
  pt1: number
  pt2: number
  pt3: number
  fouls: number
  steals: number
  rebounds: number
  assists: number
}

class PlayerStatsService extends Service {
  /** GET /matches/:matchId/player-stats — listado actual. */
  async listByMatch(matchId: string) {
    const { data } = await this.client.get<MatchPlayerStatRow[]>(
      `/matches/${matchId}/player-stats`,
    )
    return data
  }

  /** POST /matches/:matchId/player-stats — bulk upsert. */
  async upsertForMatch(matchId: string, stats: MatchPlayerStatInput[]) {
    const { data } = await this.client.post<MatchPlayerStatRow[]>(
      `/matches/${matchId}/player-stats`,
      { stats },
    )
    return data
  }

  /** GET /teams/:teamId/stats — agregado del team. */
  async getTeamStats(teamId: string) {
    const { data } = await this.client.get<TeamStatsResponse>(
      `/teams/${teamId}/stats`,
    )
    return data
  }

  /** GET /teams/:teamId/player-stats — agregado por jugador del team. */
  async getTeamPlayerStats(teamId: string) {
    const { data } = await this.client.get<TeamPlayerStatRow[]>(
      `/teams/${teamId}/player-stats`,
    )
    return data
  }
}

const playerStatsService = new PlayerStatsService(client)
export default playerStatsService
