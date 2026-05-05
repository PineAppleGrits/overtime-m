import { Injectable } from '@nestjs/common';
import { DebtsService } from '../../../debts/application/services/debts.service';
import { IDebtsEligibilityPort } from '../../application/ports/debts-port.port';

/**
 * Adapter del port `IDebtsEligibilityPort` que delega a `DebtsService` (W2.1).
 */
@Injectable()
export class DebtsEligibilityAdapter implements IDebtsEligibilityPort {
  constructor(private readonly debtsService: DebtsService) {}

  async hasOutstandingDebts(
    teamId: string,
    opts?: { allowFiftyPercentRule?: boolean },
  ): Promise<boolean> {
    return this.debtsService.hasOutstandingDebts(teamId, opts);
  }
}
