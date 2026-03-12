import employeeService from '@/modules/employee/EmployeeService'
import { EmployeeDetailContent } from '@/modules/admin/components/empleados/EmployeeDetailContent'

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { id } = await params

  let initialData: { data: null; error: string | null } = {
    data: null,
    error: null,
  }

  try {
    const response = await employeeService.getEmployeeById(id)
    initialData.data = response.data ?? response ?? null
  } catch {
    initialData.error = 'Error al cargar el empleado'
  }

  return <EmployeeDetailContent employeeId={id} initialData={initialData} />
}
