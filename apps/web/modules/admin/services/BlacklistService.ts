import { browserClient } from "@/modules/common/client/browserClient"
import { BrowserService } from "@/modules/common/services/BrowserService"
import { PaginationParams } from "@/modules/common/dto"

interface CreateBlacklistEntryDto {
  firstName: string
  lastName: string
  documentNumber: string
  reason: string
}

interface UpdateBlacklistEntryDto {
  reason?: string
  isActive?: boolean
}

class BlacklistService extends BrowserService {
  async getEntries(params?: PaginationParams & { isActive?: string }) {
    const { data } = await this.client.get("/blacklist", { params })
    return data
  }

  async getEntryById(id: string) {
    const { data } = await this.client.get(`/blacklist/${id}`)
    return data
  }

  async createEntry(dto: CreateBlacklistEntryDto) {
    const { data } = await this.client.post("/blacklist", dto)
    return data
  }

  async updateEntry(id: string, dto: UpdateBlacklistEntryDto) {
    const { data } = await this.client.patch(`/blacklist/${id}`, dto)
    return data
  }

  async deleteEntry(id: string) {
    const { data } = await this.client.delete(`/blacklist/${id}`)
    return data
  }

  async checkPlayer(documentNumber: string) {
    const { data } = await this.client.get(`/blacklist/check/${documentNumber}`)
    return data
  }
}

const blacklistService = new BlacklistService(browserClient)
export default blacklistService
