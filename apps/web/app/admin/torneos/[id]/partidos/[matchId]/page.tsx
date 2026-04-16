import { MatchDetailContent } from '@/modules/admin/components/torneos/MatchDetailContent'

export default async function AdminMatchDetailPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>
}) {
  const { id, matchId } = await params

  // TODO: conectar con API — fetch match detail + player stats
  return <MatchDetailContent tournamentId={id} matchId={matchId} />
}
