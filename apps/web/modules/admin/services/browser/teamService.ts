import { browserClient } from "@/modules/common/client/browserClient"
import { BrowserService } from "@/modules/common/services/BrowserService"
import { PaginationParams } from "@/modules/common/dto"

interface CreateTeamDto {
  name: string
  logoUrl?: string
  sportId: string
  captainId?: string
}

interface UpdateTeamDto {
  name?: string
  logoUrl?: string
  sportId?: string
  captainId?: string
}

interface AddPlayerDto {
  playerId: string
}

class TeamBrowserService extends BrowserService {
  async getTeams(params?: PaginationParams) {
    const { data } = await this.client.get("/teams", { params })
    return data
  }

  async getTeamById(id: string) {
    const { data } = await this.client.get(`/teams/${id}`)
    return data
  }

  async createTeam(dto: CreateTeamDto) {
    const { data } = await this.client.post("/teams", dto)
    return data
  }

  async updateTeam(id: string, dto: UpdateTeamDto) {
    const { data } = await this.client.patch(`/teams/${id}`, dto)
    return data
  }

  async deleteTeam(id: string) {
    const { data } = await this.client.delete(`/teams/${id}`)
    return data
  }

  async addPlayer(teamId: string, dto: AddPlayerDto) {
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
