import { browserClient } from "@/modules/common/client/browserClient"
import { BrowserService } from "@/modules/common/services/BrowserService"
import { PaginationParams } from "@/modules/common/dto"
import { TournamentStatus } from "../types"

export interface GetTournamentsParams extends PaginationParams {
  status?: TournamentStatus
  search?: string
}

export interface GetTournamentsOptions {
  signal?: AbortSignal
}

class AdminTournamentService extends BrowserService {
  async getTournaments(
    params?: GetTournamentsParams,
    options?: GetTournamentsOptions
  ) {
    const { signal } = options ?? {}
    const requestParams: Record<string, unknown> = { ...params }
    if (requestParams.search === '') delete requestParams.search
    const { data } = await this.client.get("/tournaments", {
      params: requestParams,
      signal,
    })
    return data
  }

  async getTournamentById(id: string) {
    const { data } = await this.client.get(`/tournaments/${id}`)
    return data
  }

  async createTournament(dto: {
    name: string
    description?: string
    sportId: string
    startDate: string
    endDate: string
    registrationStartDate?: string
    registrationEndDate?: string
  }) {
    const { data } = await this.client.post("/tournaments", dto)
    return data
  }

  async updateTournament(id: string, dto: Record<string, unknown>) {
    const { data } = await this.client.patch(`/tournaments/${id}`, dto)
    return data
  }

  async deleteTournament(id: string) {
    const { data } = await this.client.delete(`/tournaments/${id}`)
    return data
  }

  async changeStatus(id: string, status: TournamentStatus) {
    const { data } = await this.client.patch(`/tournaments/${id}/status`, { status })
    return data
  }

  // Registrations — uses /registrations controller
  async getRegistrations(tournamentId: string, params?: PaginationParams & { status?: string; categoryId?: string }) {
    const { data } = await this.client.get("/registrations", {
      params: { ...params, tournamentId },
    })
    return data
  }

  async approveRegistration(_tournamentId: string, registrationId: string) {
    const { data } = await this.client.patch(`/registrations/${registrationId}/approve`)
    return data
  }

  async rejectRegistration(_tournamentId: string, registrationId: string, reason?: string) {
    const { data } = await this.client.patch(`/registrations/${registrationId}/reject`, { rejectionReason: reason })
    return data
  }
}

const adminTournamentService = new AdminTournamentService(browserClient)
export default adminTournamentService
