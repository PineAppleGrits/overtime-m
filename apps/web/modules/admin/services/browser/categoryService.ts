import { browserClient } from "@/modules/common/client/browserClient"
import { BrowserService } from "@/modules/common/services/BrowserService"
import { PaginationParams } from "@/modules/common/dto"

interface CreateCategoryDto {
  name: string
  sportId: string
  playoffFormat?: 'single_elimination' | 'double_elimination' | 'round_robin'
  teamsPerZone?: number
}

interface UpdateCategoryDto {
  name?: string
  sportId?: string
  playoffFormat?: 'single_elimination' | 'double_elimination' | 'round_robin'
  teamsPerZone?: number
}

class CategoryBrowserService extends BrowserService {
  async getCategories(tournamentId: string, params?: PaginationParams) {
    const { data } = await this.client.get(`/tournaments/${tournamentId}/categories`, { params })
    return data
  }

  async createCategory(tournamentId: string, dto: CreateCategoryDto) {
    const { data } = await this.client.post(`/tournaments/${tournamentId}/categories`, {
      ...dto,
      tournamentId,
    })
    return data
  }

  async deleteCategory(tournamentId: string, id: string) {
    const { data } = await this.client.delete(`/tournaments/${tournamentId}/categories/${id}`)
    return data
  }
}

const categoryBrowserService = new CategoryBrowserService(browserClient)
export default categoryBrowserService
