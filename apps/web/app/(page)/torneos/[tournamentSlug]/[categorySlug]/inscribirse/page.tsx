import TournamentService from "@/modules/tournament/TournamentService"
import teamService from "@/modules/team/TeamService"
import registrationService from "@/modules/registration/RegistrationService"
import { getProfile } from "@/lib/auth/session"
import { redirect, notFound } from "next/navigation"
import { InscripcionContent } from "./InscripcionContent"

type TeamMember = {
  profile: { id: string; name: string; avatarUrl?: string; documentNumber?: string | null }
  isActive: boolean
}

export type MyTeam = {
  id: string
  name: string
  logoUrl?: string | null
  sport: { name: string }
  members: TeamMember[]
}

export type ExistingRegistration = {
  id: string
  status: string
  team?: { id: string; name: string; logoUrl?: string | null }
  createdAt?: string
}

export type TournamentInfo = {
  id: string
  name: string
  slug: string
  description?: string | null
  registrationStartDate?: string | null
  registrationEndDate?: string | null
}

export type CategoryInfo = {
  id: string
  name: string
  slug: string
}

export type PaymentConfig = {
  inscriptionFee: number
  insuranceFeePerPlayer: number
  paymentMethods: {
    cash: { enabled: boolean; venues: { name: string; address: string }[] }
    transfer: {
      enabled: boolean
      alias: string
      cbu: string
      bankName: string
      holder: string
    }
  }
}

async function getMyTeams(): Promise<MyTeam[]> {
  try {
    const res = await teamService.getMyTeams()
    return Array.isArray(res) ? res : (res?.data ?? [])
  } catch {
    return []
  }
}

async function getMyRegistrations(
  categoryId: string,
  profileId: string,
): Promise<ExistingRegistration[]> {
  try {
    const res = await registrationService.getRegistrations({
      categoryId,
      limit: 100,
    })
    const all = res?.data ?? []
    return all.filter(
      (r: { requester?: { id?: string } }) => r.requester?.id === profileId,
    )
  } catch {
    return []
  }
}

// TODO: fetch from API when available
function getPaymentConfig(): PaymentConfig {
  return {
    inscriptionFee: 12000,
    insuranceFeePerPlayer: 1000,
    paymentMethods: {
      cash: {
        enabled: true,
        venues: [
          { name: "Sede Central Overtime", address: "Av. Corrientes 1234, CABA" },
          { name: "Complejo Deportivo Norte", address: "Av. Cabildo 5678, CABA" },
        ],
      },
      transfer: {
        enabled: true,
        alias: "overtime.deportes",
        cbu: "0000003100012345678901",
        bankName: "Banco Nación",
        holder: "Overtime Deportes SRL",
      },
    },
  }
}

export default async function InscribirsePage({
  params,
}: {
  params: Promise<{ tournamentSlug: string; categorySlug: string }>
}) {
  const { tournamentSlug, categorySlug } = await params

  const [tournament, profile] = await Promise.all([
    TournamentService.getTournamentBySlug(tournamentSlug),
    getProfile(),
  ])

  if (!profile) {
    redirect(
      `/auth/login?redirect=${encodeURIComponent(`/torneos/${tournamentSlug}/${categorySlug}/inscribirse`)}`,
    )
  }

  if (!tournament) notFound()

  const category = tournament.categories?.find(
    (c: { slug?: string; id: string }) =>
      c.slug === categorySlug || c.id === categorySlug,
  )

  if (!category) notFound()

  const [teams, existingRegistrations] = await Promise.all([
    getMyTeams(),
    getMyRegistrations(category.id, profile.id),
  ])

  const paymentConfig = getPaymentConfig()

  // Filter out teams that already have a registration in this category
  const registeredTeamIds = new Set(
    existingRegistrations.map((r) => r.team?.id).filter(Boolean),
  )
  const availableTeams = teams.filter((t) => !registeredTeamIds.has(t.id))

  const tournamentInfo: TournamentInfo = {
    id: tournament.id,
    name: tournament.name,
    slug: tournament.slug ?? tournamentSlug,
    description: tournament.description,
    registrationStartDate: tournament.registrationStartDate,
    registrationEndDate: tournament.registrationEndDate,
  }

  const categoryInfo: CategoryInfo = {
    id: category.id,
    name: category.name,
    slug: category.slug ?? categorySlug,
  }

  return (
    <InscripcionContent
      tournament={tournamentInfo}
      category={categoryInfo}
      teams={availableTeams}
      existingRegistrations={existingRegistrations}
      paymentConfig={paymentConfig}
    />
  )
}
