import { AdminUser } from '../admin/types'
import { client } from '../common/client/baseClient'
import { PaginatedResponse, PaginationParams } from '../common/dto'
import { Service } from '../common/services/Service'

export type ProfileRole = 'master' | 'admin' | 'player' | 'photographer' | 'referee' | 'official'

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

class UserService extends Service {
  async getUsers(params?: PaginationParams & { search?: string; role?: string }) {
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
}

const userService = new UserService(client)
export default userService
