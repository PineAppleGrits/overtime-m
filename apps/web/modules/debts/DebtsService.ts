import { DebtDto, DebtStatus, DebtType } from '@overtime-mono/shared'
import { client } from '../common/client/baseClient'
import { Service } from '../common/services/Service'

export type { DebtStatus, DebtType }

/**
 * Body de POST /debts. Mirrors `apps/api/src/debts/presentation/dto/debt.zod.ts`.
 * Falta al menos uno entre teamId/profileId.
 */
export interface CreateDebtPayload {
  type: DebtType
  concept: string
  originAmount: number
  dueDate: string
  currency?: string
  teamId?: string
  profileId?: string
  registrationId?: string
  matchId?: string
  friendlyId?: string
  sanctionId?: string
  notes?: string
  metadata?: Record<string, unknown>
}

export interface ChangeDebtStatusPayload {
  toStatus: DebtStatus
  reason?: string
}

export interface DebtListFilters {
  teamId?: string
  profileId?: string
  status?: DebtStatus
  type?: DebtType
  from?: string
  to?: string
  overdueOnly?: boolean
  page?: number
  limit?: number
}

/** Shape extendida que devuelve el mapper cuando incluye relaciones. */
export interface DebtResponseDto extends DebtDto {
  payments?: Array<{
    id: string
    amount: number
    method: string
    status: string
    profileId: string
    processedAt: string | null
    createdAt: string
  }>
  childDebts?: Array<{
    id: string
    type: string
    status: string
    concept: string
    originAmount: string
    currentBalance: string
    dueDate: string
    createdAt: string
  }>
  audits?: Array<{
    id: string
    fromStatus: string
    toStatus: string
    reason: string | null
    byProfileId: string
    at: string
  }>
}

export interface DebtListResponse {
  data: DebtResponseDto[]
  total: number
  page: number
  limit: number
}

class DebtsService extends Service {
  /** RN-031 — crear deuda manual (admin). */
  async create(dto: CreateDebtPayload) {
    const { data } = await this.client.post<DebtResponseDto>('/debts', dto)
    return data
  }

  async list(filters?: DebtListFilters) {
    const { data } = await this.client.get<DebtListResponse>('/debts', {
      params: filters,
    })
    return data
  }

  async findOne(id: string) {
    const { data } = await this.client.get<DebtResponseDto>(`/debts/${id}`)
    return data
  }

  /** RN-031 — admin cambia status de la deuda. */
  async changeStatus(id: string, payload: ChangeDebtStatusPayload) {
    const { data } = await this.client.patch<DebtResponseDto>(
      `/debts/${id}/status`,
      payload,
    )
    return data
  }
}

const debtsService = new DebtsService(client)
export default debtsService
