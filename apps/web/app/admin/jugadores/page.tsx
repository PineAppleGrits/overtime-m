import playerService from '@/modules/player/PlayerService'
import { JugadoresContent } from '@/modules/admin/components/jugadores/JugadoresContent'

export default async function JugadoresPage() {
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
    const response = await playerService.getPlayers({ page: 1, limit: 10 })
    const raw = response.data ?? response
    initialData.data = raw.data ?? raw ?? []
    initialData.meta = raw.meta ?? initialData.meta
  } catch {
    initialData.error = 'Error al cargar jugadores'
  }

  return <JugadoresContent initialData={initialData} />
}
