import { client } from '../common/client/baseClient'
import { Service } from '../common/services/Service'
import { PaginationParams } from '../common/dto'

type EmployeeRole = 'arbitro' | 'fotografo' | 'agente_mesa'

interface CreateEmployeeDto {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  role: EmployeeRole
  userId?: string
}

interface UpdateEmployeeDto {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: EmployeeRole
  isActive?: boolean
}

class EmployeeService extends Service {
  async getEmployees(params?: PaginationParams & { role?: EmployeeRole; isActive?: string }) {
    const { data } = await this.client.get('/employees', { params })
    return data
  }

  async getEmployeeById(id: string) {
    const { data } = await this.client.get(`/employees/${id}`)
    return data
  }

  async createEmployee(dto: CreateEmployeeDto) {
    const { data } = await this.client.post('/employees', dto)
    return data
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const { data } = await this.client.patch(`/employees/${id}`, dto)
    return data
  }

  async deleteEmployee(id: string) {
    const { data } = await this.client.delete(`/employees/${id}`)
    return data
  }

  async getMyAssignments() {
    const { data } = await this.client.get('/employees/me/assignments')
    return data
  }
}

const employeeService = new EmployeeService(client)
export default employeeService
