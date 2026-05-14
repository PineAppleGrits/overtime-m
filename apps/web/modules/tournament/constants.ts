/**
 * Estados del ciclo de vida del torneo.
 *
 * Importamos el enum desde el subpath `@overtime-mono/shared/tournaments/enums`
 * para evitar arrastrar DTOs (class-validator/@nestjs/swagger → @nestjs/microservices)
 * al bundle del FE.
 *
 * El catálogo canónico vive en docs/specs/tournament-state-machine.md.
 */
import { TournamentStatus as TournamentStatusEnum } from '@overtime-mono/shared/tournaments/enums'

export { TournamentStatusEnum as TournamentStatus }
export type TournamentStatusValue = `${TournamentStatusEnum}`

const HIDDEN_TOURNAMENT_STATUSES: readonly TournamentStatusEnum[] = [
  TournamentStatusEnum.DRAFT,
  TournamentStatusEnum.ARCHIVED,
] as const

export const PUBLIC_TOURNAMENT_STATUSES: readonly TournamentStatusEnum[] = [
  TournamentStatusEnum.PUBLISHED,
  TournamentStatusEnum.INSCRIPTION_OPEN,
  TournamentStatusEnum.INSCRIPTION_CLOSED,
  TournamentStatusEnum.IN_PROGRESS,
  TournamentStatusEnum.PLAYING,
  TournamentStatusEnum.FINISHED,
] as const

const FIXTURE_VISIBLE_STATUSES: readonly TournamentStatusEnum[] = [
  TournamentStatusEnum.PLAYING,
  TournamentStatusEnum.FINISHED,
  TournamentStatusEnum.ARCHIVED,
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
  return (FIXTURE_VISIBLE_STATUSES as readonly string[]).includes(status)
}

export function isLiveOrPast(status?: string | null): boolean {
  return hasPublicFixture(status)
}

export function isRegistrationOpen(status?: string | null): boolean {
  return status === TournamentStatusEnum.INSCRIPTION_OPEN
}

export function isArchivedTournament(status?: string | null): boolean {
  return status === TournamentStatusEnum.ARCHIVED
}
