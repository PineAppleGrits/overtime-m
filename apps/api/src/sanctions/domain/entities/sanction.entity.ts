import {
  FechasState,
  addFechasCumplidas,
  readFechasState,
  writeFechasState,
} from '../rules/fechas-counting.rules';
import {
  SanctionStatus,
  assertCanTransition,
} from '../rules/sanction-transitions.rules';

export type SanctionTargetType = 'PROFILE' | 'TEAM';
export type SanctionKind = 'DISCIPLINARY' | 'MONETARY';

export interface SanctionProps {
  id: string;
  targetType: SanctionTargetType;
  targetProfileId: string | null;
  targetTeamId: string | null;
  kind: SanctionKind;
  status: SanctionStatus;
  reason: string;
  notes: string | null;
  attachmentUrls: string[];
  matchId: string | null;
  tournamentId: string | null;
  categoryId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  amount: number | null;
  currency: string;
  createdByProfileId: string;
  resolvedByProfileId: string | null;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidad de dominio para sanciones. Encapsula transiciones de status y
 * lectura/escritura del marcador de fechas (que vive en `notes`, ver
 * `fechas-counting.rules.ts`).
 */
export class Sanction {
  constructor(private props: SanctionProps) {}

  get id(): string {
    return this.props.id;
  }

  get status(): SanctionStatus {
    return this.props.status;
  }

  get kind(): SanctionKind {
    return this.props.kind;
  }

  get targetProfileId(): string | null {
    return this.props.targetProfileId;
  }

  get tournamentId(): string | null {
    return this.props.tournamentId;
  }

  get matchId(): string | null {
    return this.props.matchId;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  toProps(): SanctionProps {
    return { ...this.props };
  }

  /** True si está activa y dentro del rango temporal. */
  isActive(asOfDate: Date = new Date()): boolean {
    if (this.props.status !== 'ACTIVE') return false;
    if (this.props.startsAt && this.props.startsAt.getTime() > asOfDate.getTime()) return false;
    if (this.props.endsAt && this.props.endsAt.getTime() < asOfDate.getTime()) return false;
    return true;
  }

  /** Lee el estado de fechas embebido en `notes`. */
  readFechas(): FechasState | null {
    return readFechasState(this.props.notes);
  }

  /**
   * Inicializa la sanción con un total de fechas. Embebe el marcador en `notes`.
   * No modifica status. Si ya había marcador, lo sobreescribe.
   */
  initFechas(totalFechas: number): void {
    if (totalFechas <= 0 || !Number.isInteger(totalFechas)) {
      throw new Error('totalFechas debe ser un entero > 0');
    }
    this.props.notes = writeFechasState(this.props.notes, {
      totalFechas,
      fechasCumplidas: 0,
    });
  }

  /**
   * Suma N fechas cumplidas. Devuelve si alcanzó el total (auto-resolución).
   */
  addFechas(delta: number): { autoResolved: boolean; state: FechasState } {
    if (delta <= 0) throw new Error('delta debe ser > 0');
    const current = this.readFechas();
    if (!current) {
      throw new Error(
        'La sanción no tiene contador de fechas inicializado (RN-003 — sanción por fechas)',
      );
    }
    const { next, autoResolved } = addFechasCumplidas(current, delta);
    this.props.notes = writeFechasState(this.props.notes, next);
    if (autoResolved) {
      this.markResolved({ resolutionNotes: 'Auto-resuelta: fechas cumplidas' });
    }
    return { autoResolved, state: next };
  }

  /** Marca como RESOLVED. Lanza si no es transición válida. */
  markResolved(input: {
    resolvedByProfileId?: string;
    resolutionNotes?: string;
  } = {}): void {
    assertCanTransition(this.props.status, 'RESOLVED');
    this.props.status = 'RESOLVED';
    this.props.resolvedAt = new Date();
    if (input.resolvedByProfileId) {
      this.props.resolvedByProfileId = input.resolvedByProfileId;
    }
    if (input.resolutionNotes) {
      this.props.resolutionNotes = input.resolutionNotes;
    }
  }

  /** Marca como CANCELLED. */
  markCancelled(input: {
    cancelledByProfileId?: string;
    cancellationNotes?: string;
  } = {}): void {
    assertCanTransition(this.props.status, 'CANCELLED');
    this.props.status = 'CANCELLED';
    if (input.cancelledByProfileId) {
      this.props.resolvedByProfileId = input.cancelledByProfileId;
    }
    if (input.cancellationNotes) {
      this.props.resolutionNotes = input.cancellationNotes;
    }
    this.props.resolvedAt = new Date();
  }

  /**
   * Anota un AJC aplicado en notes (similar a markAjcApplied de staff).
   * Esto NO descuenta fechas — es solo rastro. La descuenta `addFechas`.
   */
  appendAjcStamp(stamp: string): void {
    this.props.notes = this.props.notes
      ? `${this.props.notes}\n${stamp}`
      : stamp;
  }
}
