import {
  CreateBlacklistEntryDto,
  CreateSanctionDto,
  EligibilityQueryDto,
  EligibilityResponseDto,
  LiftBlacklistEntryDto,
  ResolveSanctionDto,
} from '@overtime-mono/shared'
import { client } from '../common/client/baseClient'
import { Service } from '../common/services/Service'

export interface EligibilityCheckResult {
  eligible: boolean
  reasons: string[]
}

export interface MedicalHistoryAsset {
  id: string
  category: 'MEDICAL_CERT' | 'SWORN_STATEMENT'
  year: number | null
  url: string
  contentType: string
  originalFilename: string | null
  sizeBytes: number
  uploadedAt: string
  uploadedBy: string
}

class EligibilityService extends Service {
  // ── Checks consolidados (W3.3) ────────────────────────────────────────

  async checkPlayerForMatch(
    profileId: string,
    matchId: string,
    teamId?: string,
  ) {
    const { data } = await this.client.get<EligibilityCheckResult>(
      `/eligibility/players/${profileId}/match/${matchId}`,
      { params: teamId ? { teamId } : undefined },
    )
    return data
  }

  async checkPlayerForTournament(
    profileId: string,
    tournamentId: string,
    params?: { proposedTeamId?: string; proposedCategoryId?: string },
  ) {
    const { data } = await this.client.get<EligibilityCheckResult>(
      `/eligibility/players/${profileId}/tournament/${tournamentId}`,
      { params },
    )
    return data
  }

  async checkTeamForMatch(teamId: string, matchId: string) {
    const { data } = await this.client.get<EligibilityCheckResult>(
      `/eligibility/teams/${teamId}/match/${matchId}`,
    )
    return data
  }

  // ── Compat legacy ─────────────────────────────────────────────────────

  async getProfileEligibility(profileId: string, query?: EligibilityQueryDto) {
    const { data } = await this.client.get<EligibilityResponseDto>(
      `/eligibility/profiles/${profileId}`,
      { params: query },
    )
    return data
  }

  async getTeamEligibility(teamId: string, query?: EligibilityQueryDto) {
    const { data } = await this.client.get<EligibilityResponseDto>(
      `/eligibility/teams/${teamId}`,
      { params: query },
    )
    return data
  }

  // ── Sanctions/blacklist legacy (compat — bajo /eligibility) ──────────
  // Para flujos nuevos preferí SanctionsService / BlacklistService.

  async createBlacklistLegacy(dto: CreateBlacklistEntryDto) {
    const { data } = await this.client.post('/eligibility/blacklists', dto)
    return data
  }

  async listBlacklistLegacy(params?: Record<string, unknown>) {
    const { data } = await this.client.get('/eligibility/blacklists', { params })
    return data
  }

  async liftBlacklistLegacy(id: string, dto?: LiftBlacklistEntryDto) {
    const { data } = await this.client.patch(
      `/eligibility/blacklists/${id}/lift`,
      dto ?? {},
    )
    return data
  }

  async createSanctionLegacy(dto: CreateSanctionDto) {
    const { data } = await this.client.post('/eligibility/sanctions', dto)
    return data
  }

  async listSanctionsLegacy(params?: Record<string, unknown>) {
    const { data } = await this.client.get('/eligibility/sanctions', { params })
    return data
  }

  async getSanctionLegacy(id: string) {
    const { data } = await this.client.get(`/eligibility/sanctions/${id}`)
    return data
  }

  async resolveSanctionLegacy(id: string, dto?: ResolveSanctionDto) {
    const { data } = await this.client.patch(
      `/eligibility/sanctions/${id}/resolve`,
      dto ?? {},
    )
    return data
  }

  // ── Apto médico / DDJJ (RN-008) ──────────────────────────────────────

  /**
   * Sube apto médico propio. `file` debe ser un File/Blob; el backend espera
   * `multipart/form-data` con campo `file`.
   */
  async uploadMyMedicalCert(file: File | Blob, year?: number) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await this.client.post(
      '/eligibility/profiles/me/medical-cert',
      formData,
      {
        params: year !== undefined ? { year } : undefined,
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    return data
  }

  async uploadMySwornStatement(file: File | Blob, year?: number) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await this.client.post(
      '/eligibility/profiles/me/sworn-statement',
      formData,
      {
        params: year !== undefined ? { year } : undefined,
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    return data
  }

  async getMedicalHistory(
    profileId: string,
    category?: 'MEDICAL_CERT' | 'SWORN_STATEMENT',
  ) {
    const { data } = await this.client.get<MedicalHistoryAsset[]>(
      `/eligibility/profiles/${profileId}/medical-history`,
      { params: category ? { category } : undefined },
    )
    return data
  }
}

const eligibilityService = new EligibilityService(client)
export default eligibilityService
