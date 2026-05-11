export const TournamentStatus = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  READY_TO_SHIP: 'READY_TO_SHIP',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  ARCHIVED: 'ARCHIVED',
  CANCELLED: 'CANCELLED',
} as const

export type TournamentStatus =
  (typeof TournamentStatus)[keyof typeof TournamentStatus]

export const PUBLIC_TOURNAMENT_STATUSES: readonly TournamentStatus[] = [
  TournamentStatus.OPEN,
  TournamentStatus.CLOSED,
  TournamentStatus.READY_TO_SHIP,
  TournamentStatus.IN_PROGRESS,
  TournamentStatus.FINISHED,
] as const

const HIDDEN_TOURNAMENT_STATUSES: readonly TournamentStatus[] = [
  TournamentStatus.DRAFT,
  TournamentStatus.ARCHIVED,
  TournamentStatus.CANCELLED,
] as const

export function isPubliclyVisibleTournament(
  tournament: { status?: string | null; hidden?: boolean } | null | undefined,
): boolean {
  if (!tournament || tournament.hidden) return false
  if (!tournament.status) return true
  return !(HIDDEN_TOURNAMENT_STATUSES as readonly string[]).includes(
    tournament.status,
  )
}

export function hasPublicFixture(status?: string | null): boolean {
  if (!status) return false
  return (
    status === TournamentStatus.IN_PROGRESS ||
    status === TournamentStatus.FINISHED
  )
}

export function isRegistrationOpen(status?: string | null): boolean {
  return status === TournamentStatus.OPEN
}
