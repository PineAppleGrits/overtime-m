import { client } from "../common/client/baseClient"
import { Service } from "../common/services/Service"
import { PaginationParams } from "../common/dto"

interface CreateCategoryDto {
  name: string
  maxTeams?: number
  teamsPerZone?: number
}

interface UpdateCategoryDto {
  name?: string
  sportId?: string
  maxTeams?: number
  teamsPerZone?: number
}

class CategoryService extends Service {
  async getCategories(tournamentId: string, params?: PaginationParams) {
    const { data } = await this.client.get(`/tournaments/${tournamentId}/categories`, { params })
    return data
  }

  async getCategoryById(tournamentId: string, id: string) {
    const { data } = await this.client.get(`/tournaments/${tournamentId}/categories/${id}`)
    return data
  }

  async createCategory(tournamentId: string, createCategoryDto: CreateCategoryDto) {
    const { data } = await this.client.post(`/tournaments/${tournamentId}/categories`, {
      ...createCategoryDto,
      tournamentId
    })
    return data
  }

  async updateCategory(tournamentId: string, id: string, updateCategoryDto: UpdateCategoryDto) {
    const { data } = await this.client.patch(`/tournaments/${tournamentId}/categories/${id}`, updateCategoryDto)
    return data
  }

  async deleteCategory(tournamentId: string, id: string) {
    const { data } = await this.client.delete(`/tournaments/${tournamentId}/categories/${id}`)
    return data
  }
}

const categoryService = new CategoryService(client)
export default categoryService

