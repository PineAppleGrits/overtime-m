import adminTournamentServerService from '@/modules/admin-tournament/AdminTournamentService'
import { TournamentRegistrationsContent } from '@/modules/admin/components/torneos/TournamentRegistrationsContent'
import type { AdminRegistration } from '@/modules/admin/types'

export default async function RegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let initialData: {
    data: AdminRegistration[]
    meta: { total: number; page: number; limit: number; totalPages: number }
    error: string | null
  } = { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 }, error: null }

  try {
    const response = await adminTournamentServerService.getRegistrations(id, { page: 1, limit: 10 })
    const raw = response.data ?? response
    initialData.data = raw.data ?? raw ?? []
    initialData.meta = raw.meta ?? initialData.meta
  } catch {
    initialData.error = 'Error al cargar inscripciones'
  }

  return <TournamentRegistrationsContent tournamentId={id} initialData={initialData} />
}
