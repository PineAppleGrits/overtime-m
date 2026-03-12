export const dynamic = 'force-dynamic'

import { PageHeader } from '@/modules/admin/components/PageHeader'
import { MatchAssignmentList } from '@/modules/my-matches/components/MatchAssignmentList'
import { MyMatchesEmptyState } from '@/modules/my-matches/components/MyMatchesEmptyState'
import myMatchesService from '@/modules/my-matches/services/MyMatchesService'
import type { MyMatchAssignment } from '@/modules/my-matches/types'

export default async function MisPartidosPage() {
  let assignments: MyMatchAssignment[] = []
  let errorMessage: string | null = null

  try {
    assignments = await myMatchesService.getMyAssignments()
  } catch (error) {
    console.error('Error fetching my assignments:', error)
    errorMessage = 'No se pudieron cargar tus partidos. Intentá de nuevo más tarde.'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Partidos"
        description="Tus partidos asignados como parte del personal de Overtime"
      />

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : assignments.length === 0 ? (
        <MyMatchesEmptyState />
      ) : (
        <MatchAssignmentList assignments={assignments} />
      )}
    </div>
  )
}
