import employeeService from '@/modules/employee/EmployeeService'
import { EmpleadosContent } from '@/modules/admin/components/empleados/EmpleadosContent'

export default async function EmpleadosPage() {
  let initialData: {
    data: never[]
    meta: { total: number; page: number; limit: number; totalPages: number }
    error: string | null
  } = {
    data: [],
    meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
    error: null,
  }

  try {
    const response = await employeeService.getEmployees({ page: 1, limit: 10 })
    const raw = response.data ?? response
    initialData.data = raw.data ?? raw ?? []
    initialData.meta = raw.meta ?? initialData.meta
  } catch {
    initialData.error = 'Error al cargar empleados'
  }

  return <EmpleadosContent initialData={initialData} />
}
