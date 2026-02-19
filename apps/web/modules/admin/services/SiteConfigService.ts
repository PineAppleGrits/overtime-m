import { browserClient } from "@/modules/common/client/browserClient"
import { BrowserService } from "@/modules/common/services/BrowserService"

interface UpdateSiteConfigDto {
  siteName?: string
  siteDescription?: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  contactEmail?: string
  contactPhone?: string
  socialMedia?: {
    instagram?: string
    facebook?: string
    twitter?: string
    youtube?: string
  }
  paymentConfig?: {
    mercadoPagoEnabled?: boolean
    mercadoPagoPublicKey?: string
    bankTransferEnabled?: boolean
    bankTransferDetails?: string
    cashEnabled?: boolean
  }
}

class SiteConfigService extends BrowserService {
  async getConfig() {
    const { data } = await this.client.get("/site-config")
    return data
  }

  async updateConfig(dto: UpdateSiteConfigDto) {
    const { data } = await this.client.patch("/site-config", dto)
    return data
  }
}

const siteConfigService = new SiteConfigService(browserClient)
export default siteConfigService
