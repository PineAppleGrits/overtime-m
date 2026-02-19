import { client } from "../common/client/baseClient"
import { Service } from "../common/services/Service"

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

class SportService extends Service {
  async getSports() {
    const { data } = await this.client.get("/sports")
    return data
  }

  async getSportById(id: string) {
    const { data } = await this.client.get(`/sports/${id}`)
    return data
  }

  async createSport(createSportDto: CreateSportDto) {
    const { data } = await this.client.post("/sports", createSportDto)
    return data
  }

  async updateSport(id: string, updateSportDto: UpdateSportDto) {
    const { data } = await this.client.patch(`/sports/${id}`, updateSportDto)
    return data
  }

  async deleteSport(id: string) {
    const { data } = await this.client.delete(`/sports/${id}`)
    return data
  }
}

const sportService = new SportService(client)
export default sportService

