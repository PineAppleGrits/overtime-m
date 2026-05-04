import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DebtWithRelations } from '../ports/debt-repository.port';
import {
  CreateDebtInternalInput,
  CreateDebtInternalUseCase,
} from '../use-cases/create-debt-internal.use-case';
import {
  ApplyPaymentToDebtInput,
  ApplyPaymentToDebtUseCase,
} from '../use-cases/apply-payment-to-debt.use-case';
import { CheckTeamOutstandingDebtsUseCase } from '../use-cases/check-team-outstanding-debts.use-case';

/**
 * Facade pública del módulo Debts. Otras features (W2.2 Payments,
 * W3.1 Match lifecycle, registrations, friendlies, sanctions) inyectan
 * este servicio para:
 *
 * - `createInternal(input)` — crear deudas automáticas (REGISTRATION_FEE,
 *   FRIENDLY_DEPOSIT, MATCH_FEE, etc.).
 * - `applyPayment({ debtId, amount, paidByProfileId })` — descontar saldo
 *   tras un Payment. NO crea el Payment, sólo actualiza la Debt.
 * - `hasOutstandingDebts(teamId, opts?)` — chequeo RN-053. Retorna boolean.
 *
 * Esta clase es la única que se exporta del módulo. El resto de los
 * use-cases viven detrás (no exportados).
 */
@Injectable()
export class DebtsService {
  constructor(
    private readonly createInternalUseCase: CreateDebtInternalUseCase,
    private readonly applyPaymentUseCase: ApplyPaymentToDebtUseCase,
    private readonly checkOutstandingUseCase: CheckTeamOutstandingDebtsUseCase,
  ) {}

  /**
   * Crear una deuda desde otra feature.
   * Emite `debt.created`.
   */
  async createInternal(
    input: CreateDebtInternalInput,
  ): Promise<DebtWithRelations> {
    return this.createInternalUseCase.execute(input);
  }

  /**
   * Aplicar un pago a una deuda. Devuelve la deuda actualizada.
   * Emite `debt.partially.paid` o `debt.fully.paid`.
   *
   * El caller (W2.2 PaymentsService) crea el `Payment` por separado.
   */
  async applyPayment(
    input: ApplyPaymentToDebtInput,
  ): Promise<DebtWithRelations> {
    return this.applyPaymentUseCase.execute(input);
  }

  /**
   * RN-053 — Conveniencia para W3.1: ¿este equipo tiene deudas vencidas?
   */
  async hasOutstandingDebts(
    teamId: string,
    options: { allowFiftyPercentRule?: boolean; now?: Date } = {},
  ): Promise<boolean> {
    const result = await this.checkOutstandingUseCase.execute({
      teamId,
      allowFiftyPercentRule: options.allowFiftyPercentRule,
      now: options.now,
    });
    return result.hasOutstanding;
  }

  /**
   * RN-053 — Conveniencia detallada: devuelve también la lista de deudas.
   */
  async findOutstandingDebts(
    teamId: string,
    options: { allowFiftyPercentRule?: boolean; now?: Date } = {},
  ): Promise<DebtWithRelations[]> {
    const result = await this.checkOutstandingUseCase.execute({
      teamId,
      allowFiftyPercentRule: options.allowFiftyPercentRule,
      now: options.now,
    });
    return result.debts;
  }
}

// Re-export types para el contrato del puerto
export type { CreateDebtInternalInput } from '../use-cases/create-debt-internal.use-case';
export type { ApplyPaymentToDebtInput } from '../use-cases/apply-payment-to-debt.use-case';
export type { DebtWithRelations };
export { Prisma };
