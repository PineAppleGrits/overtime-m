import { client } from "../common/client/baseClient"
import { Service } from "../common/services/Service"
import { PaginationParams } from "../common/dto"

interface RegistrationFilters {
  tournamentId?: string
  teamId?: string
  categoryId?: string
  status?: string
}

interface CreateRegistrationDto {
  teamId: string
  tournamentId: string
  categoryId: string
  initialRoster: { documentNumber: string; name: string }[]
}

interface RejectRegistrationDto {
  rejectionReason?: string
}

class RegistrationService extends Service {
  async getRegistrations(params?: PaginationParams & RegistrationFilters) {
    const { data } = await this.client.get("/registrations", { params })
    return data
  }

  async getRegistrationById(id: string) {
    const { data } = await this.client.get(`/registrations/${id}`)
    return data
  }

  async createRegistration(createRegistrationDto: CreateRegistrationDto) {
    const { data } = await this.client.post("/registrations", createRegistrationDto)
    return data
  }

  async approveRegistration(id: string) {
    const { data } = await this.client.patch(`/registrations/${id}/approve`)
    return data
  }

  async rejectRegistration(id: string, rejectRegistrationDto?: RejectRegistrationDto) {
    const { data } = await this.client.patch(`/registrations/${id}/reject`, rejectRegistrationDto)
    return data
  }

  async deleteRegistration(id: string) {
    const { data } = await this.client.delete(`/registrations/${id}`)
    return data
  }
}

const registrationService = new RegistrationService(client)
export default registrationService

