import { client } from "../common/client/baseClient"
import { Service } from "../common/services/Service"
import { PaginationParams } from "../common/dto"

interface CreateZoneDto {
  name: string
  fixtureAlgorithm?: 'round_robin' | 'custom'
}

interface UpdateZoneDto {
  name?: string
  fixtureAlgorithm?: 'round_robin' | 'custom'
}

interface AssignTeamDto {
  teamId: string
}

class ZoneService extends Service {
  async getZones(categoryId: string, params?: PaginationParams) {
    const { data } = await this.client.get(`/categories/${categoryId}/zones`, { params })
    return data
  }

  async getZoneById(categoryId: string, id: string) {
    const { data } = await this.client.get(`/categories/${categoryId}/zones/${id}`)
    return data
  }

  async createZone(categoryId: string, createZoneDto: CreateZoneDto) {
    const { data } = await this.client.post(`/categories/${categoryId}/zones`, {
      ...createZoneDto,
      categoryId
    })
    return data
  }

  async updateZone(categoryId: string, id: string, updateZoneDto: UpdateZoneDto) {
    const { data } = await this.client.patch(`/categories/${categoryId}/zones/${id}`, updateZoneDto)
    return data
  }

  async deleteZone(categoryId: string, id: string) {
    const { data } = await this.client.delete(`/categories/${categoryId}/zones/${id}`)
    return data
  }

  async assignTeam(categoryId: string, zoneId: string, assignTeamDto: AssignTeamDto) {
    const { data } = await this.client.post(`/categories/${categoryId}/zones/${zoneId}/teams`, assignTeamDto)
    return data
  }

  async removeTeam(categoryId: string, zoneId: string, teamId: string) {
    const { data } = await this.client.delete(`/categories/${categoryId}/zones/${zoneId}/teams/${teamId}`)
    return data
  }
}

const zoneService = new ZoneService(client)
export default zoneService

