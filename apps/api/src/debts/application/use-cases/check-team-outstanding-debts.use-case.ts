import { Inject, Injectable } from '@nestjs/common';
import {
  DEBT_REPOSITORY,
  DebtWithRelations,
  IDebtRepository,
} from '../ports/debt-repository.port';
import { Debt } from '../../domain/entities/debt.entity';

export interface CheckTeamOutstandingInput {
  teamId: string;
  /** Permite considerar saldadas las deudas con currentBalance/origin ≤ 50%. DP-006. */
  allowFiftyPercentRule?: boolean;
  now?: Date;
}

export interface CheckTeamOutstandingOutput {
  /** True si el equipo tiene al menos una deuda vencida exigible. */
  hasOutstanding: boolean;
  /** Lista de deudas vencidas detectadas (vacía si no hay). */
  debts: DebtWithRelations[];
}

/**
 * RN-053 — Un equipo con deudas vencidas no puede jugar el siguiente partido.
 *
 * Filtros:
 * - status ∈ {APPROVED, PARTIALLY_PAID}
 * - currentBalance > 0
 * - dueDate < now
 *
 * DP-006 — `allowFiftyPercentRule`:
 * - Por defecto = false (regla estricta de RN-053).
 * - Si true, las deudas con `currentBalance/originAmount ≤ 0.5` se consideran
 *   saldadas a efectos del bloqueo. La feature consumidora (W3.1) decide cuándo
 *   activarlo. **TODO: DP-006 — habilitar cuando se confirme la regla del 50%.**
 *
 * Nota: este use-case NO emite eventos ni muta nada — es read-only.
 */
@Injectable()
export class CheckTeamOutstandingDebtsUseCase {
  constructor(
    @Inject(DEBT_REPOSITORY)
    private readonly repo: IDebtRepository,
  ) {}

  async execute(
    input: CheckTeamOutstandingInput,
  ): Promise<CheckTeamOutstandingOutput> {
    const now = input.now ?? new Date();
    const allowFiftyPercentRule = input.allowFiftyPercentRule ?? false;
    // TODO: DP-006 — habilitar cuando se confirme la regla del 50%.
    // El default de RN-053 es bloqueo estricto.

    const all = await this.repo.findOutstandingForTeam(input.teamId, now);

    if (!allowFiftyPercentRule) {
      return { hasOutstanding: all.length > 0, debts: all };
    }

    // Aplicar regla del 50%: filtrar las que NO superen el umbral.
    const remaining = all.filter((row) => {
      const debt = Debt.fromState({
        id: row.id,
        type: row.type,
        status: row.status,
        concept: row.concept,
        originAmount: row.originAmount,
        currentBalance: row.currentBalance,
        currency: row.currency,
        dueDate: row.dueDate,
        teamId: row.teamId,
        profileId: row.profileId,
        registrationId: row.registrationId,
        matchId: row.matchId,
        friendlyId: row.friendlyId,
        sanctionId: row.sanctionId,
        parentDebtId: row.parentDebtId,
        notes: row.notes,
        metadata: row.metadata,
        createdByProfileId: row.createdByProfileId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
      });
      // Si está al 50% o más pagada, NO bloquea.
      return !debt.isHalfOrMorePaid();
    });

    return { hasOutstanding: remaining.length > 0, debts: remaining };
  }
}
