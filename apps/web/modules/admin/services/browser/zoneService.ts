import { browserClient } from "@/modules/common/client/browserClient"
import { BrowserService } from "@/modules/common/services/BrowserService"

class ZoneBrowserService extends BrowserService {
  async createZone(categoryId: string, dto: { name: string }) {
    const { data } = await this.client.post(`/categories/${categoryId}/zones`, {
      ...dto,
      categoryId,
    })
    return data
  }

  async deleteZone(categoryId: string, id: string) {
    const { data } = await this.client.delete(`/categories/${categoryId}/zones/${id}`)
    return data
  }
}

const zoneBrowserService = new ZoneBrowserService(browserClient)
export default zoneBrowserService
