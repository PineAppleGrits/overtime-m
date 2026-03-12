import { client } from '../common/client/baseClient'
import { Service } from '../common/services/Service'

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

class SiteConfigService extends Service {
  async getConfig() {
    const { data } = await this.client.get('/site-config')
    return data
  }

  async updateConfig(dto: UpdateSiteConfigDto) {
    const { data } = await this.client.patch('/site-config', dto)
    return data
  }
}

const siteConfigService = new SiteConfigService(client)
export default siteConfigService
