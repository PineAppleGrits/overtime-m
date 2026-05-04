/**
 * Port hacia el módulo Debts (W2.1) para que `ApplyAjcUseCase` pueda crear
 * la Debt sin acoplarse al import directo de `DebtsService`.
 *
 * Decisión: el adapter implementa este port llamando `DebtsService.createInternal`,
 * con el `type=AJC_FEE`.
 */
export interface CreateAjcDebtInput {
  profileId: string;
  sanctionId: string;
  amount: number;
  refereeSalary: number;
  fechasFreed: number;
  appliedByProfileId: string;
}

export interface CreatedAjcDebt {
  id: string;
  amount: number;
  status: string;
}

export interface IDebtsPort {
  createAjcDebt(input: CreateAjcDebtInput): Promise<CreatedAjcDebt>;
}

export const DEBTS_PORT = Symbol('DEBTS_PORT');
