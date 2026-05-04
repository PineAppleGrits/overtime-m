import { FriendlyStatus } from '@prisma/client';
import {
  canCancelFromStatus,
  isDepositWindowExpired,
  isValidTransition,
} from '../rules/transitions';

/**
 * Snapshot mínimo de un amistoso usado por la lógica de dominio.
 * Refleja los campos relevantes; la persistencia completa vive en Prisma.
 */
export interface FriendlyState {
  id: string;
  sportId: string;
  modality: string;
  homeTeamId: string;
  awayTeamId: string;
  proposedDate: Date;
  venueId: string | null;
  status: FriendlyStatus;
  notes: string | null;
  confirmationDeadline: Date | null;
  resultingMatchId: string | null;
  observedForCategorization: boolean;
  createdByProfileId: string;
  generatedByProfileId: string | null;
  generatedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidad de dominio Friendly.
 *
 * Encapsula transiciones legales y queries de comportamiento. La instancia
 * es inmutable de cara afuera: cada operación retorna un nuevo snapshot que
 * los repositorios persisten.
 */
export class Friendly {
  private constructor(private readonly state: FriendlyState) {}

  static fromState(state: FriendlyState): Friendly {
    return new Friendly(state);
  }

  get id(): string {
    return this.state.id;
  }

  get status(): FriendlyStatus {
    return this.state.status;
  }

  get homeTeamId(): string {
    return this.state.homeTeamId;
  }

  get awayTeamId(): string {
    return this.state.awayTeamId;
  }

  get createdByProfileId(): string {
    return this.state.createdByProfileId;
  }

  get confirmationDeadline(): Date | null {
    return this.state.confirmationDeadline;
  }

  get resultingMatchId(): string | null {
    return this.state.resultingMatchId;
  }

  get observedForCategorization(): boolean {
    return this.state.observedForCategorization;
  }

  toState(): FriendlyState {
    return { ...this.state };
  }

  /** ¿El amistoso involucra a este equipo (home o away)? */
  involvesTeam(teamId: string): boolean {
    return (
      this.state.homeTeamId === teamId || this.state.awayTeamId === teamId
    );
  }

  canTransitionTo(target: FriendlyStatus): boolean {
    return isValidTransition(this.state.status, target);
  }

  canCancel(playedMatchExists = false): boolean {
    return canCancelFromStatus(this.state.status, playedMatchExists);
  }

  /** RN-023 — la ventana de 24hs venció. */
  isDepositWindowExpired(now: Date = new Date()): boolean {
    return isDepositWindowExpired(this.state.confirmationDeadline, now);
  }

  /** Estados que el cron de expiración debe revisar (RN-023). */
  isPendingDeposit(): boolean {
    return (
      this.state.status === 'GENERATED' ||
      this.state.status === 'PENDING_CONFIRMATION'
    );
  }
}
