import { client } from '@/modules/common/client/baseClient'
import { Service } from '@/modules/common/services/Service'
import type { MyMatchAssignment } from '../types'

/**
 * Server-side service for fetching the current employee's assigned matches.
 * Uses the base SSR client so data is fetched on the server.
 */
class MyMatchesService extends Service {
  async getMyAssignments(): Promise<MyMatchAssignment[]> {
    const { data } = await this.client.get<{ data: MyMatchAssignment[] }>(
      '/employees/me/assignments'
    )
    return data.data ?? data
  }

  async updateMatchScore(
    matchId: string,
    payload: { homeScore: number; awayScore: number }
  ): Promise<void> {
    await this.client.patch(`/matches/${matchId}`, payload)
  }

  async changeMatchStatus(
    matchId: string,
    payload: { status: string }
  ): Promise<void> {
    await this.client.patch(`/matches/${matchId}/status`, payload)
  }
}

const myMatchesService = new MyMatchesService(client)
export default myMatchesService
