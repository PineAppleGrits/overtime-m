import { browserClient } from "@/modules/common/client/browserClient"
import { BrowserService } from "@/modules/common/services/BrowserService"

interface CreateSportDto {
  name: string
  code: string
  description?: string
}

interface UpdateSportDto {
  name?: string
  code?: string
  description?: string
}

class SportBrowserService extends BrowserService {
  async getSports() {
    const { data } = await this.client.get("/sports")
    return data
  }

  async getSportById(id: string) {
    const { data } = await this.client.get(`/sports/${id}`)
    return data
  }

  async createSport(dto: CreateSportDto) {
    const { data } = await this.client.post("/sports", dto)
    return data
  }

  async updateSport(id: string, dto: UpdateSportDto) {
    const { data } = await this.client.patch(`/sports/${id}`, dto)
    return data
  }

  async deleteSport(id: string) {
    const { data } = await this.client.delete(`/sports/${id}`)
    return data
  }
}

const sportBrowserService = new SportBrowserService(browserClient)
export default sportBrowserService
