import TournamentService from "@/modules/tournament/TournamentService"
import teamService from "@/modules/team/TeamService"
import { getProfile } from "@/lib/auth/session"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { InscribirseForm } from "./InscribirseForm"
import { cn } from "@/lib/utils"

type TeamMember = {
  profile: { id: string; name: string; avatarUrl?: string }
  isActive: boolean
}

type MyTeam = {
  id: string
  name: string
  logoUrl?: string | null
  sport: { name: string }
  members: TeamMember[]
}

async function getMyTeams(): Promise<MyTeam[]> {
  try {
    const res = await teamService.getMyTeams()
    return Array.isArray(res) ? res : (res?.data ?? [])
  } catch {
    return []
  }
}

export default async function InscribirsePage({
  params,
}: {
  params: Promise<{ tournamentSlug: string; categorySlug: string }>
}) {
  const { tournamentSlug, categorySlug } = await params

  const [tournament, profile, teams] = await Promise.all([
    TournamentService.getTournamentBySlug(tournamentSlug),
    getProfile(),
    getMyTeams(),
  ])

  if (!profile) {
    redirect(
      `/auth/login?redirect=${encodeURIComponent(`/torneos/${tournamentSlug}/${categorySlug}`)}`
    )
  }

  if (!tournament) notFound()

  const category = tournament.categories?.find(
    (c) => c.slug === categorySlug || c.id === categorySlug
  )

  if (!category) notFound()

  return (
    <div className="min-h-screen bg-ot-background text-white">
      <div className="ot-container py-8 md:py-12">
        <nav aria-label="Navegación" className="mb-8">
          <Link
            href={`/torneos/${tournamentSlug}/${categorySlug}`}
            className={cn(
              "inline-flex items-center gap-2 text-sm text-white/70 hover:text-ot-orange",
              "focus:outline-none focus:ring-2 focus:ring-ot-orange focus:ring-offset-2 focus:ring-offset-ot-background rounded"
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Volver a la categoría
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Inscribirse
          </h1>
          <p className="mt-2 text-white/70">
            {tournament.name} · {category.name}
          </p>
        </header>

        <InscribirseForm
          tournamentId={tournament.id}
          categoryId={category.id}
          categorySlug={categorySlug}
          tournamentSlug={tournamentSlug}
          initialTeams={teams}
        />
      </div>
    </div>
  )
}
