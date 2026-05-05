/**
 * Port hacia W2.1 (DebtsService) usado por eligibility para RN-053.
 *
 * Mantenemos el port mínimo (solo `hasOutstandingDebts`) para evitar acoplar
 * eligibility con la entidad completa de Debt.
 */
export interface IDebtsEligibilityPort {
  /**
   * RN-053 — true si el equipo tiene deudas vencidas activas que bloquean
   * partidos.
   */
  hasOutstandingDebts(
    teamId: string,
    opts?: { allowFiftyPercentRule?: boolean },
  ): Promise<boolean>;
}

export const DEBTS_ELIGIBILITY_PORT = Symbol('DEBTS_ELIGIBILITY_PORT');
