import { client } from "../common/client/baseClient"
import type {
  AddPlayerSchemaDto,
  CreateTeamSchemaDto,
  UpdateTeamSchemaDto,
} from "@overtime-mono/shared/teams/contracts"
import { Service } from "../common/services/Service"
import { PaginationParams } from "../common/dto"
import type { MatchPreviewData } from "../common/components/MatchPreview/types"

interface CreateFranchiseDto {
  name: string
  logoUrl?: string
}

export interface TeamMatchesResponse {
  lastMatch: MatchPreviewData | null
  nextMatch: MatchPreviewData | null
}

class TeamService extends Service {
  async createFranchise(dto: CreateFranchiseDto) {
    const { data } = await this.client.post('/franchises', dto)
    return data
  }

  async getMyTeams() {
    const { data } = await this.client.get('/teams/mine')
    return data
  }

  async getTeams(params?: PaginationParams) {
    const { data } = await this.client.get("/teams", { params })
    return data
  }

  async getTeamById(id: string) {
    const { data } = await this.client.get(`/teams/${id}`)
    return data
  }

  async createTeam(createTeamDto: CreateTeamSchemaDto) {
    const { data } = await this.client.post("/teams", createTeamDto)
    return data
  }

  async updateTeam(id: string, updateTeamDto: UpdateTeamSchemaDto) {
    const { data } = await this.client.patch(`/teams/${id}`, updateTeamDto)
    return data
  }

  async deleteTeam(id: string) {
    const { data } = await this.client.delete(`/teams/${id}`)
    return data
  }

  async addPlayer(teamId: string, addPlayerDto: AddPlayerSchemaDto) {
    const { data } = await this.client.post(`/teams/${teamId}/players`, addPlayerDto)
    return data
  }

  async removePlayer(teamId: string, playerId: string) {
    const { data } = await this.client.delete(`/teams/${teamId}/players/${playerId}`)
    return data
  }

  async assignCaptain(teamId: string, playerId: string) {
    const { data } = await this.client.patch(`/teams/${teamId}/captain/${playerId}`)
    return data
  }

  /**
   * Último partido finalizado y/o próximo programado del team.
   * - sin `type`: ambos.
   * - `type='last'`: solo lastMatch.
   * - `type='next'`: solo nextMatch.
   */
  async getTeamMatches(teamId: string, type?: 'last' | 'next') {
    const { data } = await this.client.get<TeamMatchesResponse>(
      `/teams/${teamId}/matches`,
      type ? { params: { type } } : undefined,
    )
    return data
  }
}

const teamService = new TeamService(client)
export default teamService

