import { client } from "../common/client/baseClient"
import { Service } from "../common/services/Service"
import { PaginationParams } from "../common/dto"

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

interface CheckAvailabilityDto {
  date: string
  endDate?: string
  excludeMatchId?: string
}

class VenueService extends Service {
  async getVenues(params?: PaginationParams & { isActive?: string }) {
    const { data } = await this.client.get("/venues", { params })
    return data
  }

  async getAvailableVenues(checkAvailabilityDto: CheckAvailabilityDto, params?: PaginationParams) {
    const { data } = await this.client.get("/venues/available", {
      params: { ...checkAvailabilityDto, ...params }
    })
    return data
  }

  async getVenueById(id: string) {
    const { data } = await this.client.get(`/venues/${id}`)
    return data
  }

  async checkAvailability(id: string, checkAvailabilityDto: CheckAvailabilityDto) {
    const { data } = await this.client.get(`/venues/${id}/availability`, {
      params: checkAvailabilityDto
    })
    return data
  }

  async createVenue(createVenueDto: CreateVenueDto) {
    const { data } = await this.client.post("/venues", createVenueDto)
    return data
  }

  async updateVenue(id: string, updateVenueDto: UpdateVenueDto) {
    const { data } = await this.client.patch(`/venues/${id}`, updateVenueDto)
    return data
  }

  async deleteVenue(id: string) {
    const { data } = await this.client.delete(`/venues/${id}`)
    return data
  }
}

const venueService = new VenueService(client)
export default venueService

