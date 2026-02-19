import { browserClient } from "@/modules/common/client/browserClient"
import { BrowserService } from "@/modules/common/services/BrowserService"
import { PaginationParams } from "@/modules/common/dto"

interface CreateVenueDto {
  name: string
  address?: string
  city?: string
  province?: string
  country?: string
  googleMapsUrl?: string
  capacity?: number
  isActive?: boolean
}

interface UpdateVenueDto {
  name?: string
  address?: string
  city?: string
  province?: string
  country?: string
  googleMapsUrl?: string
  capacity?: number
  isActive?: boolean
}

class VenueBrowserService extends BrowserService {
  async getVenues(params?: PaginationParams & { isActive?: string }) {
    const { data } = await this.client.get("/venues", { params })
    return data
  }

  async getVenueById(id: string) {
    const { data } = await this.client.get(`/venues/${id}`)
    return data
  }

  async createVenue(dto: CreateVenueDto) {
    const { data } = await this.client.post("/venues", dto)
    return data
  }

  async updateVenue(id: string, dto: UpdateVenueDto) {
    const { data } = await this.client.patch(`/venues/${id}`, dto)
    return data
  }

  async deleteVenue(id: string) {
    const { data } = await this.client.delete(`/venues/${id}`)
    return data
  }
}

const venueBrowserService = new VenueBrowserService(browserClient)
export default venueBrowserService
