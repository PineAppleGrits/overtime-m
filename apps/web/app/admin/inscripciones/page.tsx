import registrationService from '@/modules/registration/RegistrationService'
import { InscripcionesContent } from '@/modules/admin/components/inscripciones/InscripcionesContent'

export default async function InscripcionesPage() {
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
    const response = await registrationService.getRegistrations({ page: 1, limit: 10 })
    const raw = response.data ?? response
    initialData.data = raw.data ?? raw ?? []
    initialData.meta = raw.meta ?? initialData.meta
  } catch {
    initialData.error = 'Error al cargar inscripciones'
  }

  return <InscripcionesContent initialData={initialData} />
}
