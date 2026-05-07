import {
  AssignStaffToMatchDto,
  BatchAssignStaffDto,
  CreateStaffDto,
  SetAvailabilityDto,
  StaffType,
  UpdateStaffDto,
} from '@overtime-mono/shared'
import { client } from '../common/client/baseClient'
import { PaginatedResponse, PaginationParams } from '../common/dto'
import { Service } from '../common/services/Service'

export type { StaffType }

export interface StaffAvailabilitySlot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface StaffResponseDto {
  id: string
  profileId: string | null
  type: string
  firstName: string
  lastName: string
  phone: string | null
  email: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  availability: StaffAvailabilitySlot[]
  assignmentsCount?: number
}

export interface MatchStaffResponseDto {
  id: string
  matchId: string
  staffId: string
  role: string
  status: string
  assignedBy: string | null
  assignedAt: string | null
  createdAt: string
  match?: {
    id: string
    matchDate: string
    matchTime: string | null
    status: string
  }
}

/** Body de RN-030 (preview) — `apps/api/src/staff/presentation/dto/ajc.dto.ts`. */
export interface ComputeAjcPayload {
  refereeSalary: number
  fechasToFree: number
}

/** Body de RN-030 (apply). */
export interface ApplyAjcPayload {
  profileId: string
  sanctionId: string
  refereeSalary: number
  fechasToFree: number
  sanctionTotalFechas?: number
}

/** Body de RN-051 — crear carpeta Drive para fotos del partido. */
export interface CreatePhotoFolderPayload {
  parentFolderId?: string
}

export interface StaffListParams extends PaginationParams {
  type?: StaffType
  isActive?: boolean
}

export interface FindAvailableStaffParams {
  date: string
  type?: StaffType
  excludeBusy?: boolean
}

class StaffService extends Service {
  // ── CRUD ──────────────────────────────────────────────────────────────

  async create(dto: CreateStaffDto) {
    const { data } = await this.client.post<StaffResponseDto>('/staff', dto)
    return data
  }

  async list(params?: StaffListParams) {
    const { data } = await this.client.get<PaginatedResponse<StaffResponseDto>>(
      '/staff',
      { params },
    )
    return data
  }

  async findOne(id: string) {
    const { data } = await this.client.get<StaffResponseDto>(`/staff/${id}`)
    return data
  }

  async update(id: string, dto: UpdateStaffDto) {
    const { data } = await this.client.patch<StaffResponseDto>(
      `/staff/${id}`,
      dto,
    )
    return data
  }

  async remove(id: string) {
    const { data } = await this.client.delete<{ message: string }>(
      `/staff/${id}`,
    )
    return data
  }

  // ── Disponibilidad ────────────────────────────────────────────────────

  /** Staff disponible para una fecha, opcionalmente excluyendo conflictos. */
  async findAvailable(params: FindAvailableStaffParams) {
    const { data } = await this.client.get<StaffResponseDto[]>(
      '/staff/available',
      { params },
    )
    return data
  }

  async setAvailability(id: string, dto: SetAvailabilityDto) {
    const { data } = await this.client.post<StaffAvailabilitySlot[]>(
      `/staff/${id}/availability`,
      dto,
    )
    return data
  }

  async getAssignedMatches(id: string, status?: string) {
    const { data } = await this.client.get<MatchStaffResponseDto[]>(
      `/staff/${id}/matches`,
      { params: status ? { status } : undefined },
    )
    return data
  }

  // ── Asignación a partidos (RN-050) ────────────────────────────────────

  async assignToMatch(matchId: string, dto: AssignStaffToMatchDto) {
    const { data } = await this.client.post<MatchStaffResponseDto>(
      `/staff/matches/${matchId}/assign`,
      dto,
    )
    return data
  }

  async batchAssign(dto: BatchAssignStaffDto) {
    const { data } = await this.client.post<{
      assigned: MatchStaffResponseDto[]
      errors: Array<{ matchId: string; staffId: string; error: string }>
    }>('/staff/matches/batch-assign', dto)
    return data
  }

  async removeFromMatch(matchId: string, staffId: string) {
    const { data } = await this.client.delete<{ message: string }>(
      `/staff/matches/${matchId}/staff/${staffId}`,
    )
    return data
  }

  // ── RN-030 — AJC ──────────────────────────────────────────────────────

  async computeAjc(payload: ComputeAjcPayload) {
    const { data } = await this.client.post('/staff/ajc/compute', payload)
    return data
  }

  async applyAjc(payload: ApplyAjcPayload) {
    const { data } = await this.client.post('/staff/ajc/apply', payload)
    return data
  }

  // ── RN-051 — Drive folder ─────────────────────────────────────────────

  async createPhotoFolder(matchId: string, payload?: CreatePhotoFolderPayload) {
    const { data } = await this.client.post(
      `/staff/matches/${matchId}/photo-folder`,
      payload ?? {},
    )
    return data
  }
}

const staffService = new StaffService(client)
export default staffService
