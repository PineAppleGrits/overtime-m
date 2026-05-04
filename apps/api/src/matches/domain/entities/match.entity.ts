import {
  MATCH_STATUS,
  MatchStatusValue,
  canTransitionMatchStatus,
  isTerminal,
} from '../rules/transitions.rules';

export interface MatchState {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  categoryId: string | null;
  zoneId: string | null;
  venueId: string | null;
  matchDate: Date;
  matchTime: string | null;
  status: string;
  matchType: string;
  homeScore: number;
  awayScore: number;
  costPerTeam: number | null;
  seriesId: string | null;
  seriesGameNumber: number | null;
  playoffStage: string | null;
}

/**
 * Aggregate root del partido. NO persiste — se crea desde el row de Prisma
 * y los use-cases la usan para chequear invariantes y calcular nuevo estado.
 */
export class Match {
  private constructor(public readonly state: MatchState) {}

  static fromState(state: MatchState): Match {
    return new Match({ ...state });
  }

  get id(): string {
    return this.state.id;
  }

  get status(): string {
    return this.state.status;
  }

  get matchDate(): Date {
    return this.state.matchDate;
  }

  get homeTeamId(): string | null {
    return this.state.homeTeamId;
  }

  get awayTeamId(): string | null {
    return this.state.awayTeamId;
  }

  get seriesId(): string | null {
    return this.state.seriesId;
  }

  isTerminal(): boolean {
    return isTerminal(this.state.status);
  }

  canTransitionTo(next: MatchStatusValue): boolean {
    return canTransitionMatchStatus(this.state.status, next);
  }

  canStart(): boolean {
    return this.canTransitionTo(MATCH_STATUS.EN_CURSO);
  }

  canFinish(): boolean {
    return this.state.status === MATCH_STATUS.EN_CURSO;
  }

  canCancelByTeam(): boolean {
    return this.state.status === MATCH_STATUS.PROGRAMADO;
  }

  canSuspend(): boolean {
    return (
      this.state.status === MATCH_STATUS.EN_CURSO ||
      this.state.status === MATCH_STATUS.PROGRAMADO
    );
  }

  isInRivalDecisionPending(): boolean {
    return this.state.status === MATCH_STATUS.PENDING_RIVAL_DECISION;
  }

  isSuspendedPending(): boolean {
    return this.state.status === MATCH_STATUS.SUSPENDIDO_PENDIENTE;
  }

  involvesTeam(teamId: string): boolean {
    return this.state.homeTeamId === teamId || this.state.awayTeamId === teamId;
  }

  rivalOf(teamId: string): string | null {
    if (this.state.homeTeamId === teamId) return this.state.awayTeamId;
    if (this.state.awayTeamId === teamId) return this.state.homeTeamId;
    return null;
  }
}
