import { browserClient } from "@/modules/common/client/browserClient"
import { BrowserService } from "@/modules/common/services/BrowserService"
import { PaginationParams } from "@/modules/common/dto"
import { EmployeeRole } from "../types"

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

interface AssignMatchDto {
  matchId: string
  role: EmployeeRole
}

class EmployeeService extends BrowserService {
  async getEmployees(params?: PaginationParams & { role?: EmployeeRole; isActive?: string }) {
    const { data } = await this.client.get("/employees", { params })
    return data
  }

  async getEmployeeById(id: string) {
    const { data } = await this.client.get(`/employees/${id}`)
    return data
  }

  async createEmployee(dto: CreateEmployeeDto) {
    const { data } = await this.client.post("/employees", dto)
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

  async assignMatch(employeeId: string, dto: AssignMatchDto) {
    const { data } = await this.client.post(`/employees/${employeeId}/matches`, dto)
    return data
  }

  async unassignMatch(employeeId: string, matchId: string) {
    const { data } = await this.client.delete(`/employees/${employeeId}/matches/${matchId}`)
    return data
  }

  async getMyAssignments() {
    const { data } = await this.client.get("/employees/me/assignments")
    return data
  }
}

const employeeService = new EmployeeService(browserClient)
export default employeeService
