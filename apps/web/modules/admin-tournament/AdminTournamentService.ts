import { client } from '../common/client/baseClient'
import { Service } from '../common/services/Service'
import { PaginationParams } from '../common/dto'

type TournamentStatus = 'draft' | 'published' | 'archived'
type PaymentMethod = 'transferencia' | 'efectivo' | 'configurado'

interface CreateTournamentDto {
  name: string
  description?: string
  sportId: string
  startDate: string
  endDate: string
  registrationStartDate?: string
  registrationEndDate?: string
}

interface UpdateTournamentDto {
  name?: string
  description?: string
  sportId?: string
  status?: TournamentStatus
  startDate?: string
  endDate?: string
  registrationStartDate?: string
  registrationEndDate?: string
  registrationOpen?: boolean
}

interface CreatePricingDto {
  paymentMethod: PaymentMethod
  amount: number
  dateFrom: string
  dateTo: string
}

interface ManualRegistrationDto {
  teamId: string
  categoryId: string
  paymentMethod?: PaymentMethod
  paymentAmount?: number
  autoApprove?: boolean
}

class AdminTournamentServerService extends Service {
  async getTournaments(params?: PaginationParams & { status?: TournamentStatus; search?: string }) {
    const requestParams: Record<string, unknown> = { ...params }
    if (requestParams.search === '') delete requestParams.search
    const { data } = await this.client.get('/admin/tournaments', { params: requestParams })
    return data
  }

  async getTournamentById(id: string) {
    const { data } = await this.client.get(`/admin/tournaments/${id}`)
    return data
  }

  async createTournament(dto: CreateTournamentDto) {
    const { data } = await this.client.post('/admin/tournaments', dto)
    return data
  }

  async updateTournament(id: string, dto: UpdateTournamentDto) {
    const { data } = await this.client.patch(`/admin/tournaments/${id}`, dto)
    return data
  }

  async deleteTournament(id: string) {
    const { data } = await this.client.delete(`/admin/tournaments/${id}`)
    return data
  }

  async changeStatus(id: string, status: TournamentStatus) {
    const { data } = await this.client.patch(`/admin/tournaments/${id}/status`, { status })
    return data
  }

  async closeRegistrations(id: string) {
    const { data } = await this.client.patch(`/admin/tournaments/${id}/close-registrations`)
    return data
  }

  async getPricing(tournamentId: string) {
    const { data } = await this.client.get(`/admin/tournaments/${tournamentId}/pricing`)
    return data
  }

  async createPricing(tournamentId: string, dto: CreatePricingDto) {
    const { data } = await this.client.post(`/admin/tournaments/${tournamentId}/pricing`, dto)
    return data
  }

  async deletePricing(tournamentId: string, pricingId: string) {
    const { data } = await this.client.delete(`/admin/tournaments/${tournamentId}/pricing/${pricingId}`)
    return data
  }

  async manualRegistration(tournamentId: string, dto: ManualRegistrationDto) {
    const { data } = await this.client.post(`/admin/tournaments/${tournamentId}/manual-registration`, dto)
    return data
  }

  async getRegistrations(tournamentId: string, params?: PaginationParams & { status?: string; categoryId?: string }) {
    const { data } = await this.client.get(`/admin/tournaments/${tournamentId}/registrations`, { params })
    return data
  }

  async approveRegistration(tournamentId: string, registrationId: string) {
    const { data } = await this.client.patch(`/admin/tournaments/${tournamentId}/registrations/${registrationId}/approve`)
    return data
  }

  async rejectRegistration(tournamentId: string, registrationId: string, reason?: string) {
    const { data } = await this.client.patch(`/admin/tournaments/${tournamentId}/registrations/${registrationId}/reject`, { rejectionReason: reason })
    return data
  }

  async confirmPayment(tournamentId: string, registrationId: string) {
    const { data } = await this.client.patch(`/admin/tournaments/${tournamentId}/registrations/${registrationId}/confirm-payment`)
    return data
  }
}

const adminTournamentServerService = new AdminTournamentServerService(client)
export default adminTournamentServerService
