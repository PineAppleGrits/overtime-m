import { client } from '../common/client/baseClient'
import { Service } from '../common/services/Service'
import type {
  ActiveStatusResponse,
  ProfileResponseDto,
} from '../user/UserService'

/**
 * Endpoints del propio usuario autenticado sobre SU perfil
 * (apps/api/src/users/presentation/controllers/profile.controller.ts).
 *
 * Distinto del legacy AuthService (/auth/profile) — este apunta a /profiles/*.
 */

export interface UploadDniPhotoResponse {
  profile: ProfileResponseDto
  assetId: string
  verified: boolean
  requiresManualReview: boolean
}

class ProfileService extends Service {
  async getMe() {
    const { data } = await this.client.get<ProfileResponseDto>('/profiles/me')
    return data
  }

  /** RN-037 — estado activo/inactivo del perfil propio. */
  async getMyStatus() {
    const { data } = await this.client.get<ActiveStatusResponse>(
      '/profiles/me/status',
    )
    return data
  }

  /** RN-036 — sube la foto de DNI propia. Trigger de verificación automática (DP-009). */
  async uploadMyDniPhoto(file: File | Blob) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await this.client.post<UploadDniPhotoResponse>(
      '/profiles/me/dni-photo',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  }
}

const profileService = new ProfileService(client)
export default profileService
