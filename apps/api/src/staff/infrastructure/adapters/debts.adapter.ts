import { Injectable } from '@nestjs/common';
import { DebtsService } from '../../../debts/application/services/debts.service';
import {
  CreatedAjcDebt,
  CreateAjcDebtInput,
  IDebtsPort,
} from '../../application/ports/debts.port';

/**
 * Adapter del port `IDebtsPort` que delega en `DebtsService.createInternal`
 * (W2.1) para crear la Debt AJC con `type=AJC_FEE`.
 *
 * Decisión de modelado:
 * - El "sueldo del árbitro" NO existe como columna en el schema. Lo guardamos
 *   en `metadata` de la Debt (`{ refereeSalary, fechasFreed, sanctionId }`)
 *   para auditoría y para que W3.3 pueda leerlo cuando libere fechas.
 * - `dueDate` = hoy (la deuda es exigible inmediatamente; el jugador no se
 *   habilita hasta pagar).
 */
@Injectable()
export class DebtsAdapter implements IDebtsPort {
  constructor(private readonly debtsService: DebtsService) {}

  async createAjcDebt(input: CreateAjcDebtInput): Promise<CreatedAjcDebt> {
    const debt = await this.debtsService.createInternal({
      type: 'AJC_FEE',
      concept: `Habilitación anticipada (AJC) — ${input.fechasFreed} fecha(s)`,
      originAmount: input.amount,
      currency: 'ARS',
      profileId: input.profileId,
      sanctionId: input.sanctionId,
      dueDate: new Date(),
      notes: `AJC RN-030: sueldo árbitro $${input.refereeSalary} × ${input.fechasFreed} fechas.`,
      metadata: {
        refereeSalary: input.refereeSalary,
        fechasFreed: input.fechasFreed,
        sanctionId: input.sanctionId,
      },
      createdByProfileId: input.appliedByProfileId,
    });

    return {
      id: debt.id,
      amount: Number(debt.originAmount.toString()),
      status: debt.status,
    };
  }
}
