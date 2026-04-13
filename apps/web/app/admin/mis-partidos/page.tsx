export const dynamic = 'force-dynamic'

import { PageHeader } from '@/modules/admin/components/PageHeader'
import { MatchAssignmentList } from '@/modules/my-matches/components/MatchAssignmentList'
import myMatchesService from '@/modules/my-matches/services/MyMatchesService'
import type { MyMatchAssignment } from '@/modules/my-matches/types'

export default async function MisPartidosPage() {
  let assignments: MyMatchAssignment[] = []
  let error: string | null = null

  try {
    assignments = await myMatchesService.getMyAssignments()
  } catch (e) {
    console.error('Error fetching my assignments:', e)
    error = 'No se pudieron cargar tus partidos. Intentá de nuevo más tarde.'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Partidos"
        description="Tus partidos asignados como parte del personal de Overtime"
      />

      <MatchAssignmentList assignments={assignments} error={error} />
    </div>
  )
}
