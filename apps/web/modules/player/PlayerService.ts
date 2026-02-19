import { client } from "../common/client/baseClient"
import { Service } from "../common/services/Service"
import { PaginationParams } from "../common/dto"

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

class PlayerService extends Service {
  async getPlayers(params?: PaginationParams) {
    const { data } = await this.client.get("/players", { params })
    return data
  }

  async getPlayerById(id: string) {
    const { data } = await this.client.get(`/players/${id}`)
    return data
  }

  async createPlayer(createPlayerDto: CreatePlayerDto) {
    const { data } = await this.client.post("/players", createPlayerDto)
    return data
  }

  async updatePlayer(id: string, updatePlayerDto: UpdatePlayerDto) {
    const { data } = await this.client.patch(`/players/${id}`, updatePlayerDto)
    return data
  }

  async deletePlayer(id: string) {
    const { data } = await this.client.delete(`/players/${id}`)
    return data
  }
}

const playerService = new PlayerService(client)
export default playerService

