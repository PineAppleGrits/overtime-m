import { browserClient } from "@/modules/common/client/browserClient"
import { BrowserService } from "@/modules/common/services/BrowserService"
import { PaginationParams } from "@/modules/common/dto"

interface RegistrationFilters {
  tournamentId?: string
  teamId?: string
  categoryId?: string
  status?: string
}

class RegistrationBrowserService extends BrowserService {
  async getRegistrations(params?: PaginationParams & RegistrationFilters) {
    const { data } = await this.client.get("/registrations", { params })
    return data
  }

  async approveRegistration(id: string) {
    const { data } = await this.client.patch(`/registrations/${id}/approve`)
    return data
  }

  async rejectRegistration(id: string, dto?: { rejectionReason?: string }) {
    const { data } = await this.client.patch(`/registrations/${id}/reject`, dto)
    return data
  }
}

const registrationBrowserService = new RegistrationBrowserService(browserClient)
export default registrationBrowserService
