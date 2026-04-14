import { TournamentsContent } from '@/modules/admin/components/TournamentsContent'
import type { AdminTournament } from '@/modules/admin/types'
import TournamentService from '@/modules/tournament/TournamentService'

export default async function TournamentsPage() {
  const initialData = await TournamentService.getTournaments({ page: 1, limit: 10 })

  return (
    <TournamentsContent
      initialData={{
        data: (initialData.data ?? []) as unknown as AdminTournament[],
        meta: initialData.meta,
      }}
    />
  )
}
