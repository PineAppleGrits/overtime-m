import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  DEBT_REPOSITORY,
  DebtWithRelations,
  IDebtRepository,
} from '../ports/debt-repository.port';
import {
  DEBT_CONTEXT,
  IDebtContext,
} from '../ports/debt-context.port';

export interface GetDebtInput {
  debtId: string;
  callerProfileId: string;
  isAdmin: boolean;
}

/**
 * Detalle de una Debt con pagos asociados, debts hijas (intereses) y audits.
 *
 * Reglas de visibilidad:
 * - Admin: ve cualquiera.
 * - Usuario: solo si profileId === callerProfileId OR teamId in callerTeams.
 *   Si no, devuelve NOT_FOUND (evita leak por enumeración de IDs).
 */
@Injectable()
export class GetDebtUseCase {
  constructor(
    @Inject(DEBT_REPOSITORY)
    private readonly repo: IDebtRepository,
    @Inject(DEBT_CONTEXT)
    private readonly context: IDebtContext,
  ) {}

  async execute(input: GetDebtInput): Promise<DebtWithRelations> {
    const debt = await this.repo.findById(input.debtId);
    if (!debt) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Deuda ${input.debtId} no encontrada`,
        HttpStatus.NOT_FOUND,
        { debtId: input.debtId },
      );
    }

    if (input.isAdmin) {
      return debt;
    }

    const visibleTeamIds = await this.context.findTeamIdsForProfile(
      input.callerProfileId,
    );
    const isOwnerByProfile =
      debt.profileId !== null && debt.profileId === input.callerProfileId;
    const isOwnerByTeam =
      debt.teamId !== null && visibleTeamIds.includes(debt.teamId);

    if (!isOwnerByProfile && !isOwnerByTeam) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Deuda ${input.debtId} no encontrada`,
        HttpStatus.NOT_FOUND,
        { debtId: input.debtId },
      );
    }

    return debt;
  }
}
