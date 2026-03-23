import { browserClient } from '@/modules/common/client/browserClient'
import { BrowserService } from '@/modules/common/services/BrowserService'
import { PaginationParams } from '@/modules/common/dto'
import { ProfileRole } from '@/modules/admin/types'

interface CreateUserDto {
  name: string
  email?: string
  phone?: string
  documentNumber?: string
  dateOfBirth?: string
  role?: ProfileRole
}

interface UpdateUserDto {
  name?: string
  email?: string
  phone?: string
  documentNumber?: string
  dateOfBirth?: string
  role?: ProfileRole
}

class UserBrowserService extends BrowserService {
  async getUsers(params?: PaginationParams & { search?: string; role?: string }) {
    const { data } = await this.client.get('/users', { params })
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
}

const userBrowserService = new UserBrowserService(browserClient)
export default userBrowserService
