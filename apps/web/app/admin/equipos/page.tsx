import teamService from '@/modules/team/TeamService'
import { EquiposContent } from '@/modules/admin/components/equipos/EquiposContent'

export default async function EquiposPage() {
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
    const response = await teamService.getTeams({ page: 1, limit: 10 })
    const raw = response.data ?? response
    initialData.data = raw.data ?? raw ?? []
    initialData.meta = raw.meta ?? initialData.meta
  } catch {
    initialData.error = 'Error al cargar equipos'
  }

  return <EquiposContent initialData={initialData} />
}
