import {
  CreateSanctionDto,
  ResolveSanctionDto,
  SanctionKindDto,
  SanctionQueryDto,
  SanctionStatusDto,
  SanctionTargetTypeDto,
} from '@overtime-mono/shared'
import { client } from '../common/client/baseClient'
import { Service } from '../common/services/Service'

/**
 * Backend permite extender CreateSanction con `totalFechas` (RN-003) en
 * /sanctions (no en el endpoint legacy /eligibility/sanctions). Acá lo
 * sumamos al DTO de shared para no duplicar definiciones del resto.
 */
export type CreateSanctionPayload = CreateSanctionDto & {
  totalFechas?: number
}

export interface CancelSanctionPayload {
  cancellationNotes?: string
}

export interface SanctionResponseDto {
  id: string
  targetType: SanctionTargetTypeDto
  targetProfileId: string | null
  targetTeamId: string | null
  kind: SanctionKindDto
  status: SanctionStatusDto
  reason: string
  notes: string | null
  attachmentUrls: string[]
  matchId: string | null
  tournamentId: string | null
  categoryId: string | null
  startsAt: string | null
  endsAt: string | null
  amount: number | null
  currency: string
  fechas: { totalFechas: number; fechasCumplidas: number } | null
  createdByProfileId: string
  resolvedByProfileId: string | null
  resolvedAt: string | null
  resolutionNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface SanctionListResponse {
  data: SanctionResponseDto[]
  total: number
  page: number
  limit: number
}

class SanctionsService extends Service {
  async create(dto: CreateSanctionPayload) {
    const { data } = await this.client.post<SanctionResponseDto>(
      '/sanctions',
      dto,
    )
    return data
  }

  async list(query?: SanctionQueryDto) {
    const { data } = await this.client.get<SanctionListResponse>('/sanctions', {
      params: query,
    })
    return data
  }

  async getById(id: string) {
    const { data } = await this.client.get<SanctionResponseDto>(
      `/sanctions/${id}`,
    )
    return data
  }

  async resolve(id: string, dto?: ResolveSanctionDto) {
    const { data } = await this.client.post<SanctionResponseDto>(
      `/sanctions/${id}/resolve`,
      dto ?? {},
    )
    return data
  }

  async cancel(id: string, dto?: CancelSanctionPayload) {
    const { data } = await this.client.post<SanctionResponseDto>(
      `/sanctions/${id}/cancel`,
      dto ?? {},
    )
    return data
  }

  /**
   * Sube un adjunto a la sanción. `file` se manda como `multipart/form-data`
   * con campo `file`. Devuelve la sanción actualizada y los datos del asset.
   */
  async uploadAttachment(id: string, file: File | Blob) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await this.client.post<{
      sanction: SanctionResponseDto
      assetId: string
      url: string
    }>(`/sanctions/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }
}

const sanctionsService = new SanctionsService(client)
export default sanctionsService
