import { browserClient } from "@/modules/common/client/browserClient"
import { BrowserService } from "@/modules/common/services/BrowserService"
import { PaginationParams } from "@/modules/common/dto"

interface CreatePlayerDto {
  firstName: string
  lastName: string
  jerseyNumber?: number
  position?: string
  height?: number
  weight?: number
  photoUrl?: string
}

interface UpdatePlayerDto {
  firstName?: string
  lastName?: string
  jerseyNumber?: number
  position?: string
  height?: number
  weight?: number
  photoUrl?: string
}

class PlayerBrowserService extends BrowserService {
  async getPlayers(params?: PaginationParams) {
    const { data } = await this.client.get("/players", { params })
    return data
  }

  async getPlayerById(id: string) {
    const { data } = await this.client.get(`/players/${id}`)
    return data
  }

  async createPlayer(dto: CreatePlayerDto) {
    const { data } = await this.client.post("/players", dto)
    return data
  }

  async updatePlayer(id: string, dto: UpdatePlayerDto) {
    const { data } = await this.client.patch(`/players/${id}`, dto)
    return data
  }

  async deletePlayer(id: string) {
    const { data } = await this.client.delete(`/players/${id}`)
    return data
  }
}

const playerBrowserService = new PlayerBrowserService(browserClient)
export default playerBrowserService
