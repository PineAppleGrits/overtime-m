import { getProfile } from '@/lib/auth/session'
import { hasAdminRole } from '@/lib/auth/hasAdminRole'
import teamService from '@/modules/team/TeamService'
import { getTeamBalance } from '@/modules/team/TeamBalanceService'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { GestionarTabs } from './GestionarTabs'

interface TeamDetail {
  id: string
  name: string
  captainId?: string
  creatorId: string
  sport: { name: string }
  captain?: { id: string; name: string }
  franchise?: { id: string; name: string; logoUrl?: string | null } | null
}

async function getTeam(id: string): Promise<TeamDetail | null> {
  try {
    const res = await teamService.getTeamById(id)
    return res?.data ?? res
  } catch {
    return null
  }
}

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [team, profile, balance] = await Promise.all([
    getTeam(id),
    getProfile(),
    getTeamBalance(id),
  ])

  if (!team) notFound()

  const isAdmin = profile ? hasAdminRole(profile) : false
  const isCreator = profile?.id === team.creatorId
  const isCaptain = profile?.id === team.captainId

  if (!isAdmin && !isCreator && !isCaptain) notFound()

  return (
    <div className="bg-ot-background text-white min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <Link
          href={`/equipos/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al equipo
        </Link>

        <h1 className="text-xl font-bold font-din-display">{team.name}</h1>

        <GestionarTabs
          teamId={id}
          teamName={team.name}
          sportName={team.sport.name}
          franchise={team.franchise ?? null}
          balance={balance}
        />
      </div>
    </div>
  )
}
