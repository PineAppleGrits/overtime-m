import { browserClient } from "@/modules/common/client/browserClient"
import type {
  AddPlayerSchemaDto,
  CreateTeamSchemaDto,
  UpdateTeamSchemaDto,
} from "@overtime-mono/shared/teams/contracts"
import { BrowserService } from "@/modules/common/services/BrowserService"
import { PaginationParams } from "@/modules/common/dto"

class TeamBrowserService extends BrowserService {
  async getTeams(params?: PaginationParams) {
    const { data } = await this.client.get("/teams", { params })
    return data
  }

  async getTeamById(id: string) {
    const { data } = await this.client.get(`/teams/${id}`)
    return data
  }

  async createTeam(dto: CreateTeamSchemaDto) {
    const { data } = await this.client.post("/teams", dto)
    return data
  }

  async updateTeam(id: string, dto: UpdateTeamSchemaDto) {
    const { data } = await this.client.patch(`/teams/${id}`, dto)
    return data
  }

  async deleteTeam(id: string) {
    const { data } = await this.client.delete(`/teams/${id}`)
    return data
  }

  async addPlayer(teamId: string, dto: AddPlayerSchemaDto) {
    const { data } = await this.client.post(`/teams/${teamId}/players`, dto)
    return data
  }

  async removePlayer(teamId: string, playerId: string) {
    const { data } = await this.client.delete(`/teams/${teamId}/players/${playerId}`)
    return data
  }
}

const teamBrowserService = new TeamBrowserService(browserClient)
export default teamBrowserService
