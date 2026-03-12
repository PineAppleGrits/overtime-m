import blacklistService from '@/modules/blacklist/BlacklistService'
import { BlacklistContent } from '@/modules/admin/components/blacklist/BlacklistContent'

export default async function BlacklistPage() {
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
    const response = await blacklistService.getEntries({ page: 1, limit: 10 })
    const raw = response.data ?? response
    initialData.data = raw.data ?? raw ?? []
    initialData.meta = raw.meta ?? initialData.meta
  } catch {
    initialData.error = 'Error al cargar la lista negra'
  }

  return <BlacklistContent initialData={initialData} />
}
