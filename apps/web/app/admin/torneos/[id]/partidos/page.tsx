import { MatchSchedulerContent } from '@/modules/admin/components/torneos/MatchSchedulerContent'

export default async function TournamentMatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // TODO: conectar con API — fetch fechas, canchas y partidos del torneo
  return <MatchSchedulerContent tournamentId={id} />
}
