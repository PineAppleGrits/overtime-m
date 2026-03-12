import teamService from '@/modules/team/TeamService'
import sportService from '@/modules/sport/SportService'
import { EditTeamContent } from '@/modules/admin/components/equipos/EditTeamContent'

interface EditTeamPageProps {
  params: Promise<{ id: string }>
}

export default async function EditTeamPage({ params }: EditTeamPageProps) {
  const { id } = await params

  let initialData: { data: null; error: string | null } = { data: null, error: null }
  let sports: { id: string; name: string }[] = []

  try {
    const [teamResponse, sportsResponse] = await Promise.all([
      teamService.getTeamById(id),
      sportService.getSports(),
    ])
    initialData.data = teamResponse.data ?? teamResponse ?? null
    sports = sportsResponse.data ?? sportsResponse ?? []
  } catch {
    initialData.error = 'Error al cargar el equipo'
  }

  return <EditTeamContent teamId={id} initialData={initialData} sports={sports} />
}
