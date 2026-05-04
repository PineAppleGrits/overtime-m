import { Injectable } from '@nestjs/common';
import { DebtsService } from '../../../debts/application/services/debts.service';
import { IDebtsCheckPort } from '../../application/ports/debts-check.port';

/**
 * Adapter que implementa el puerto `IDebtsCheckPort` delegando a
 * `DebtsService.hasOutstandingDebts`. Permite que Matches no dependa
 * directamente del módulo Debts.
 */
@Injectable()
export class DebtsCheckAdapter implements IDebtsCheckPort {
  constructor(private readonly debts: DebtsService) {}

  async hasOutstandingDebts(
    teamId: string,
    options?: { allowFiftyPercentRule?: boolean; now?: Date },
  ): Promise<boolean> {
    return this.debts.hasOutstandingDebts(teamId, options);
  }
}
