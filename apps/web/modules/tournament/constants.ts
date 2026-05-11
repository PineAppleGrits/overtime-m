export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',
  VISIBLE: 'visible',
  INVISIBLE: 'invisible',
  INSCRIPCION_CERRADA: 'inscripcion_cerrada',
  FINALIZADO: 'finalizado',
  ARCHIVADO: 'archivado',
} as const

export type TournamentStatus =
  (typeof TOURNAMENT_STATUS)[keyof typeof TOURNAMENT_STATUS]

export const PUBLIC_TOURNAMENT_STATUSES: readonly TournamentStatus[] = [
  TOURNAMENT_STATUS.VISIBLE,
  TOURNAMENT_STATUS.INSCRIPCION_CERRADA,
  TOURNAMENT_STATUS.FINALIZADO,
] as const

export function isPubliclyVisibleTournament(
  tournament: { status?: string | null; hidden?: boolean } | null | undefined,
): boolean {
  if (!tournament || tournament.hidden) return false
  if (!tournament.status) return true
  return (PUBLIC_TOURNAMENT_STATUSES as readonly string[]).includes(
    tournament.status,
  )
}
