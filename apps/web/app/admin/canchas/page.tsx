import venueService from '@/modules/venue/VenueService'
import { CanchasContent } from '@/modules/admin/components/canchas/CanchasContent'

export default async function CanchasPage() {
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
    const response = await venueService.getVenues({ page: 1, limit: 10 })
    const raw = response.data ?? response
    initialData.data = raw.data ?? raw ?? []
    initialData.meta = raw.meta ?? initialData.meta
  } catch {
    initialData.error = 'Error al cargar canchas'
  }

  return <CanchasContent initialData={initialData} />
}
