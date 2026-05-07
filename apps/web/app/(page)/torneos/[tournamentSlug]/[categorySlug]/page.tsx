import { getProfile } from "@/lib/auth/session"
import { hasAdminRole } from "@/lib/auth/hasAdminRole"
import RegistrationService from "@/modules/registration/RegistrationService"
import categoryService from "@/modules/tournament/CategoryService"
import type {
  CategoryFixtureResponse,
  CategoryStandingsResponse,
} from "@/modules/tournament/CategoryService"
import { CategoryDetailContent } from "@/modules/tournament/components/CategoryDetailContent"
import TournamentService from "@/modules/tournament/TournamentService"
import { notFound } from "next/navigation"

const EMPTY_STANDINGS: CategoryStandingsResponse = { zones: [] }
const EMPTY_FIXTURE: CategoryFixtureResponse = { rounds: [] }

async function getCategoryQueries(categoryId: string) {
  const [standings, fixture] = await Promise.all([
    categoryService.getCategoryStandings(categoryId).catch(() => EMPTY_STANDINGS),
    categoryService.getCategoryFixture(categoryId).catch(() => EMPTY_FIXTURE),
  ])
  return { standings, fixture }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ tournamentSlug: string; categorySlug: string }>
}) {
  const { tournamentSlug, categorySlug } = await params

  let category: Awaited<ReturnType<typeof TournamentService.getCategoryBySlug>> | null = null
  let tournament: {
    id: string; name: string; slug: string; status?: string
  } | null = null
  let profile: Awaited<ReturnType<typeof getProfile>> = null

  try {
    ;[category, profile] = await Promise.all([
      TournamentService.getCategoryBySlug(tournamentSlug, categorySlug),
      getProfile(),
    ])
    tournament = category?.tournament ?? null
  } catch {
    notFound()
  }

  if (!category || !tournament) notFound()

  let registrations: {
    status?: string
    requester?: { id?: string }
    team?: { id?: string }
    rosterEntries?: { profileId?: string }[]
  }[] = []
  try {
    const registrationsResponse = await RegistrationService.getRegistrations({
      categoryId: category.id,
      limit: 500,
    })
    registrations = registrationsResponse?.data ?? []
  } catch {
    // Registrations failed to load — page still renders without registration data
  }

  const myRegistration = profile
    ? registrations.find(
      (r) =>
        r.requester?.id === profile.id ||
        r.rosterEntries?.some((entry) => entry.profileId === profile.id)
    )
    : null

  const isMyTeamPlaying = !!myRegistration && myRegistration.status === 'approved'
  const isRequester = !!profile && myRegistration?.requester?.id === profile.id
  const canManageTeam = !!profile && (isRequester || hasAdminRole(profile))

  const { standings, fixture } = await getCategoryQueries(category.id)

  return (
    <div className="min-h-screen bg-ot-background text-white">
      {/* Tournament Header — full width */}
      <div className="bg-[#181525] h-28 font-din-display text-ot-orange text-center uppercase">
        <h1 className="flex flex-col gap-2 h-full items-center justify-center flex-wrap sm:flex-row text-xl sm:text-2xl">
          {tournament.name}
          <strong className="font-bold">{category.name}</strong>
        </h1>
      </div>

      {/* Tabs pegados al header */}
      <CategoryDetailContent
        categoryName={category.name}
        tournamentSlug={tournamentSlug}
        categorySlug={categorySlug}
        isMyTeamPlaying={isMyTeamPlaying}
        myTeamId={myRegistration?.team?.id}
        categoryId={category.id}
        canManageTeam={canManageTeam}
        standings={standings}
        fixture={fixture}
      />
    </div>
  )
}
