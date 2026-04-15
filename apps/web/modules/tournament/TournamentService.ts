import { client } from "../common/client/baseClient"
import { Service } from "../common/services/Service"
import { Category, Tournament } from "../common/types"
import { PaginatedResponse, PaginationParams } from "../common/dto"

interface CreateTournamentDto {
  name: string
  description?: string
  sportId: string
  status?: 'draft' | 'visible' | 'invisible' | 'inscripcion_cerrada' | 'finalizado' | 'archivado'
  startDate?: string
  endDate?: string
  registrationStartDate?: string
  registrationEndDate?: string
}

interface UpdateTournamentDto {
  name?: string
  description?: string
  sportId?: string
  status?: 'draft' | 'visible' | 'invisible' | 'inscripcion_cerrada' | 'finalizado' | 'archivado'
  startDate?: string
  endDate?: string
  registrationStartDate?: string
  registrationEndDate?: string
}

interface ChangeStatusDto {
  status: 'draft' | 'visible' | 'invisible' | 'inscripcion_cerrada' | 'finalizado' | 'archivado'
}

class TournamentService extends Service {
  async getTournaments(params?: PaginationParams & { status?: string }) {
    const { data } = await this.client.get<PaginatedResponse<Tournament>>("/tournaments", { params })
    return data
  }

  async getTournamentById(id: string) {
    const { data } = await this.client.get<Tournament>(`/tournaments/${id}`)
    return data
  }

  async createTournament(createTournamentDto: CreateTournamentDto) {
    const { data } = await this.client.post("/tournaments", createTournamentDto)
    return data
  }

  async updateTournament(id: string, updateTournamentDto: UpdateTournamentDto) {
    const { data } = await this.client.patch(`/tournaments/${id}`, updateTournamentDto)
    return data
  }

  async changeTournamentStatus(id: string, changeStatusDto: ChangeStatusDto) {
    const { data } = await this.client.patch(`/tournaments/${id}/status`, changeStatusDto)
    return data
  }

  async deleteTournament(id: string) {
    const { data } = await this.client.delete(`/tournaments/${id}`)
    return data
  }

  // Legacy methods for backward compatibility
  async getTournamentBySlug(slug: string) {
        const { data } = await this.client.get<Tournament>(`/tournaments/by-slug/${slug}`)
        return data
    }
    async getCategoryBySlug(tournamentSlug: string, categorySlug: string) {
        const { data } = await this.client.get<Category & { tournament?: { id: string; name: string; slug: string; status?: string } }>(`/tournaments/by-slug/${tournamentSlug}/categories/${categorySlug}`)
        return data
    }
}

const tournamentService = new TournamentService(client)
export default tournamentService