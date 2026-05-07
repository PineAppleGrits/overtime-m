import { client } from "../common/client/baseClient"
import { Service } from "../common/services/Service"
import { PaginationParams } from "../common/dto"
import type { MatchPreviewData } from "../common/components/MatchPreview/types"

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

export interface CategoryStandingEntry {
  position: number
  teamId: string
  teamName: string
  teamLogo: string | null
  played: number
  won: number
  lost: number
  pointsFor: number
  pointsAgainst: number
  diff: number
  points: number
}

export interface CategoryStandingsZone {
  id: string
  name: string
  standings: CategoryStandingEntry[]
}

export interface CategoryStandingsResponse {
  zones: CategoryStandingsZone[]
}

export interface CategoryFixtureRound {
  name: string
  date: string
  matches: MatchPreviewData[]
}

export interface CategoryFixtureResponse {
  rounds: CategoryFixtureRound[]
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

  /** BE-MOCK-003 — tabla de posiciones por zona. */
  async getCategoryStandings(categoryId: string) {
    const { data } = await this.client.get<CategoryStandingsResponse>(
      `/categories/${categoryId}/standings`,
    )
    return data
  }

  /** BE-MOCK-002 — fixture agrupado por ronda. */
  async getCategoryFixture(categoryId: string) {
    const { data } = await this.client.get<CategoryFixtureResponse>(
      `/categories/${categoryId}/fixture`,
    )
    return data
  }
}

const categoryService = new CategoryService(client)
export default categoryService

