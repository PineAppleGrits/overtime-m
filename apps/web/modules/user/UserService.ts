import { CreateUserDto, UpdateUserDto } from '@overtime-mono/shared'
import { AdminUser } from '../admin/types'
import { client } from '../common/client/baseClient'
import { PaginatedResponse, PaginationParams } from '../common/dto'
import { Service } from '../common/services/Service'

export type ProfileRole = 'master' | 'admin' | 'player' | 'photographer' | 'referee' | 'official'

export interface VerifyDniPayload {
  documentNumber: string
}

export interface AssignRolePayload {
  role: ProfileRole
}

export interface PreCreateAccountPayload {
  email: string
  role: ProfileRole
  name?: string
}

export interface ProfileResponseDto {
  id: string
  supabaseUserId: string | null
  email: string | null
  name: string
  phone: string | null
  documentNumber: string | null
  documentVerified: boolean
  documentVerifiedBy: string | null
  documentVerifiedAt: string | null
  dateOfBirth: string | null
  avatarUrl: string | null
  medicalCertificateUrl: string | null
  swornStatementUrl: string | null
  avatarAssetId: string | null
  currentMedicalAssetId: string | null
  currentSwornAssetId: string | null
  dniPhotoAssetId: string | null
  role: string
  createdAt: string
  updatedAt: string
}

export interface VerifyDniResponse {
  profile: ProfileResponseDto
  blacklisted: boolean
  merged: boolean
  mergedFromProfileId: string | null
}

export interface ActiveStatusResponse {
  active: boolean
  reasons: string[]
}

class UserService extends Service {
  // ── CRUD legacy (UsersController) ─────────────────────────────────────

  async getUsers(params?: PaginationParams & { search?: string; role?: string | string[] }) {
    const { data } = await this.client.get<PaginatedResponse<AdminUser>>('/users', { params })
    return data
  }

  async getUserById(id: string) {
    const { data } = await this.client.get(`/users/${id}`)
    return data
  }

  async createUser(dto: CreateUserDto) {
    const { data } = await this.client.post('/users', dto)
    return data
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const { data } = await this.client.patch(`/users/${id}`, dto)
    return data
  }

  async deleteUser(id: string) {
    const { data } = await this.client.delete(`/users/${id}`)
    return data
  }

  // ── Admin W3.4 (UsersAdminController) ─────────────────────────────────

  /** RN-034 / RN-035 / RN-036 — verificación manual del DNI por admin. */
  async verifyDni(profileId: string, payload: VerifyDniPayload) {
    const { data } = await this.client.post<VerifyDniResponse>(
      `/users/${profileId}/verify-dni`,
      payload,
    )
    return data
  }

  /** RN-057 — asignar rol a un usuario existente. */
  async assignRole(profileId: string, payload: AssignRolePayload) {
    const { data } = await this.client.post<ProfileResponseDto>(
      `/users/${profileId}/role`,
      payload,
    )
    return data
  }

  /** RN-057 — pre-crear cuenta con rol asignado. */
  async preCreateAccount(payload: PreCreateAccountPayload) {
    const { data } = await this.client.post<ProfileResponseDto>(
      '/users/pre-create',
      payload,
    )
    return data
  }

  /** RN-037 — estado activo/inactivo computado de un perfil (admin). */
  async getActiveStatus(profileId: string) {
    const { data } = await this.client.get<ActiveStatusResponse>(
      `/users/${profileId}/status`,
    )
    return data
  }
}

const userService = new UserService(client)
export default userService
