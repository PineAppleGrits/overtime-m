import categoryService from '@/modules/tournament/CategoryService'
import adminTournamentServerService from '@/modules/admin-tournament/AdminTournamentService'
import { CategoryDetailContent } from '@/modules/admin/components/torneos/CategoryDetailContent'
import type { AdminCategory, AdminTournament } from '@/modules/admin/types'

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string; categoryId: string }>
}) {
  const { id: tournamentId, categoryId } = await params

  const [categoryResult, tournamentResult] = await Promise.allSettled([
    categoryService.getCategoryById(tournamentId, categoryId),
    adminTournamentServerService.getTournamentById(tournamentId),
  ])

  const initialCategory: { data: AdminCategory | null; error: string | null } =
    categoryResult.status === 'fulfilled'
      ? { data: (categoryResult.value.data ?? categoryResult.value) as AdminCategory, error: null }
      : { data: null, error: 'Error al cargar la categoría' }

  const tournament =
    tournamentResult.status === 'fulfilled'
      ? ((tournamentResult.value.data ?? tournamentResult.value) as AdminTournament)
      : null

  return (
    <CategoryDetailContent
      tournamentId={tournamentId}
      categoryId={categoryId}
      tournamentName={tournament?.name ?? 'Torneo'}
      tournamentFixtureFormat={tournament?.fixtureFormat}
      tournamentModality={tournament?.modality ?? undefined}
      initialCategory={initialCategory}
    />
  )
}
