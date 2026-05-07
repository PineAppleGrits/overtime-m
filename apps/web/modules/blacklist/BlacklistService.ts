import {
  BlacklistQueryDto,
  CreateBlacklistEntryDto,
  LiftBlacklistEntryDto,
} from '@overtime-mono/shared'
import { client } from '../common/client/baseClient'
import { PaginationParams } from '../common/dto'
import { Service } from '../common/services/Service'

export interface BlacklistEntryDto {
  id: string
  profileId: string | null
  documentNumber: string | null
  profileNameSnapshot: string | null
  reason: string
  attachmentUrls: string[]
  status: 'ACTIVE' | 'LIFTED'
  blockedByProfileId: string
  liftedByProfileId: string | null
  liftedAt: string | null
  resolutionNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface BlacklistListResponse {
  data: BlacklistEntryDto[]
  total: number
  page: number
  limit: number
}

export interface BlacklistCheckResponse {
  blocked: boolean
  entries: BlacklistEntryDto[]
}

/** Shape mínima esperada por la UI legacy. Mantenido para no romper compilación. */
interface LegacyCreateEntry {
  firstName: string
  lastName: string
  documentNumber: string
  reason: string
}

interface LegacyUpdateEntry {
  reason?: string
  isActive?: boolean
}

class BlacklistService extends Service {
  // ── Endpoints nuevos (W3.3 — /blacklist/*) ────────────────────────────

  async create(dto: CreateBlacklistEntryDto) {
    const { data } = await this.client.post<BlacklistEntryDto>(
      '/blacklist',
      dto,
    )
    return data
  }

  async list(query?: BlacklistQueryDto) {
    const { data } = await this.client.get<BlacklistListResponse>(
      '/blacklist',
      { params: query },
    )
    return data
  }

  async lift(id: string, dto?: LiftBlacklistEntryDto) {
    const { data } = await this.client.post<BlacklistEntryDto>(
      `/blacklist/${id}/lift`,
      dto ?? {},
    )
    return data
  }

  /** Endpoint público (RN-001) — chequea si un DNI está bloqueado. */
  async checkByDocument(documentNumber: string) {
    const { data } = await this.client.get<BlacklistCheckResponse>(
      `/blacklist/check/${encodeURIComponent(documentNumber)}`,
    )
    return data
  }

  // ── Compat con UI existente — TODO: migrar a los métodos nuevos ──────
  // El BE expone los antiguos endpoints bajo /eligibility/blacklists/*.
  // updateEntry y deleteEntry ya no existen en BE; quedan como placeholders
  // hasta que la UI se reescriba.

  async getEntries(params?: PaginationParams & { isActive?: string }) {
    const { data } = await this.client.get('/eligibility/blacklists', { params })
    return data
  }

  async createEntry(dto: LegacyCreateEntry) {
    const { data } = await this.client.post('/eligibility/blacklists', {
      profileNameSnapshot: `${dto.firstName} ${dto.lastName}`.trim(),
      documentNumber: dto.documentNumber,
      reason: dto.reason,
    })
    return data
  }

  /** @deprecated BE ya no soporta update — usar `lift` para reactivar/levantar. */
  async updateEntry(id: string, dto: LegacyUpdateEntry) {
    if (dto.isActive === false) {
      return this.lift(id, { resolutionNotes: dto.reason })
    }
    throw new Error(
      'updateEntry no está soportado por la API actual; usar create/lift.',
    )
  }

  /** @deprecated BE ya no soporta delete — usar `lift`. */
  async deleteEntry(id: string) {
    return this.lift(id)
  }

  /**
   * @deprecated Conserva el shape legacy `{ data: { isBlacklisted, reason } }`
   * que la UI antigua espera. Para nuevos consumidores usar `checkByDocument`.
   */
  async checkPlayer(documentNumber: string) {
    const response = await this.checkByDocument(documentNumber)
    const first = response.entries[0]
    return {
      data: {
        isBlacklisted: response.blocked,
        reason: first?.reason ?? null,
      },
    }
  }
}

const blacklistService = new BlacklistService(client)
export default blacklistService
