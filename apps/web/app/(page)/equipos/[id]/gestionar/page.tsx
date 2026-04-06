import { getProfile } from '@/lib/auth/session'
import { hasAdminRole } from '@/lib/auth/hasAdminRole'
import teamService from '@/modules/team/TeamService'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Settings } from 'lucide-react'
import { SettingsForm } from './SettingsForm'

interface TeamDetail {
  id: string
  name: string
  captainId?: string
  creatorId: string
  sport: { name: string }
  captain?: { id: string; name: string }
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
  const [team, profile] = await Promise.all([getTeam(id), getProfile()])

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

        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-ot-orange" />
          <h1 className="text-xl font-bold font-din-display">
            Configuración — {team.name}
          </h1>
        </div>

        <SettingsForm
          teamId={id}
          teamName={team.name}
          sportName={team.sport.name}
          captainName={team.captain?.name ?? null}
        />
      </div>
    </div>
  )
}
