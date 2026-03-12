import adminTournamentServerService from '@/modules/admin-tournament/AdminTournamentService'
import sportService from '@/modules/sport/SportService'
import { EditTournamentContent } from '@/modules/admin/components/torneos/EditTournamentContent'
import type { AdminTournament } from '@/modules/admin/types'

export default async function EditTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [tournamentResult, sportsResult] = await Promise.allSettled([
    adminTournamentServerService.getTournamentById(id),
    sportService.getSports(),
  ])

  const initialData: { data: AdminTournament | null; error: string | null } =
    tournamentResult.status === 'fulfilled'
      ? { data: (tournamentResult.value.data ?? tournamentResult.value) as AdminTournament, error: null }
      : { data: null, error: 'Error al cargar el torneo' }

  const sports: { id: string; name: string; code: string }[] =
    sportsResult.status === 'fulfilled'
      ? (sportsResult.value.data ?? sportsResult.value ?? [])
      : []

  return <EditTournamentContent tournamentId={id} initialData={initialData} sports={sports} />
}
