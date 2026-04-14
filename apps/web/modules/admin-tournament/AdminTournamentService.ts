import { client } from '../common/client/baseClient'
import { Service } from '../common/services/Service'
import { PaginationParams } from '../common/dto'

class AdminTournamentServerService extends Service {
  async getTournaments(params?: PaginationParams & { status?: string; search?: string }) {
    const requestParams: Record<string, unknown> = { ...params }
    if (requestParams.search === '') delete requestParams.search
    const { data } = await this.client.get('/tournaments', { params: requestParams })
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
    const { data } = await this.client.post('/tournaments', dto)
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

  async changeStatus(id: string, status: string) {
    const { data } = await this.client.patch(`/tournaments/${id}/status`, { status })
    return data
  }

  // Registrations — uses /registrations controller
  async getRegistrations(tournamentId: string, params?: PaginationParams & { status?: string; categoryId?: string }) {
    const { data } = await this.client.get('/registrations', {
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

const adminTournamentServerService = new AdminTournamentServerService(client)
export default adminTournamentServerService
