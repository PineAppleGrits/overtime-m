import { client } from "../common/client/baseClient"
import { Service } from "../common/services/Service"
import { PaginationParams } from "../common/dto"

interface MatchFilters {
  status?: string
  categoryId?: string
  zoneId?: string
  venueId?: string
  matchType?: string
}

interface CreateMatchDto {
  homeTeamId: string
  awayTeamId: string
  categoryId?: string
  zoneId?: string
  venueId?: string
  matchDate: string
  matchTime?: string
  status?: 'programado' | 'en_curso' | 'suspendido' | 'cancelado' | 'reprogramado' | 'finalizado'
  matchType?: 'regular' | 'playoff' | 'final' | 'amistoso'
  homeScore?: number
  awayScore?: number
  costPerTeam?: number
}

interface UpdateMatchDto {
  homeTeamId?: string
  awayTeamId?: string
  categoryId?: string
  zoneId?: string
  venueId?: string
  matchDate?: string
  matchTime?: string
  status?: 'programado' | 'en_curso' | 'suspendido' | 'cancelado' | 'reprogramado' | 'finalizado'
  matchType?: 'regular' | 'playoff' | 'final' | 'amistoso'
  homeScore?: number
  awayScore?: number
  costPerTeam?: number
}

interface ChangeMatchStatusDto {
  status: 'programado' | 'en_curso' | 'suspendido' | 'cancelado' | 'reprogramado' | 'finalizado'
}

interface CreateAnnouncementDto {
  type: 'suspension' | 'cancellation' | 'reschedule' | 'other'
  title: string
  message: string
}

class MatchService extends Service {
  async getMatches(params?: PaginationParams & MatchFilters) {
    const { data } = await this.client.get("/matches", { params })
    return data
  }

  async getMatchById(id: string) {
    const { data } = await this.client.get(`/matches/${id}`)
    return data
  }

  async createMatch(createMatchDto: CreateMatchDto) {
    const { data } = await this.client.post("/matches", createMatchDto)
    return data
  }

  async updateMatch(id: string, updateMatchDto: UpdateMatchDto) {
    const { data } = await this.client.patch(`/matches/${id}`, updateMatchDto)
    return data
  }

  async changeMatchStatus(id: string, changeStatusDto: ChangeMatchStatusDto) {
    const { data } = await this.client.patch(`/matches/${id}/status`, changeStatusDto)
    return data
  }

  async deleteMatch(id: string) {
    const { data } = await this.client.delete(`/matches/${id}`)
    return data
  }

  async createAnnouncement(matchId: string, createAnnouncementDto: CreateAnnouncementDto) {
    const { data } = await this.client.post(`/matches/${matchId}/announcements`, createAnnouncementDto)
    return data
  }

  async getAnnouncements(matchId: string) {
    const { data } = await this.client.get(`/matches/${matchId}/announcements`)
    return data
  }
}

const matchService = new MatchService(client)
export default matchService

