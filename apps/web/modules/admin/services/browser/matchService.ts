import { browserClient } from '@/modules/common/client/browserClient'
import { BrowserService } from '@/modules/common/services/BrowserService'
import { PaginationParams } from '@/modules/common/dto'

interface MatchFilters {
  status?: string
  categoryId?: string
  zoneId?: string
  venueId?: string
  matchType?: string
}

class MatchBrowserService extends BrowserService {
  async getMatches(params?: PaginationParams & MatchFilters) {
    const { data } = await this.client.get('/matches', { params })
    return data
  }

  async getMatchById(id: string) {
    const { data } = await this.client.get(`/matches/${id}`)
    return data
  }
}

const matchBrowserService = new MatchBrowserService(browserClient)
export default matchBrowserService
