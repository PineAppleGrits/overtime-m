/**
 * Contexto externo del módulo Debts. Resuelve datos que vienen de otras
 * features (memberships, tournaments) sin dependencia directa.
 */
export interface IDebtContext {
  /**
   * Devuelve los teamIds en los que el profile es miembro activo
   * (ProfileTeam.isActive = true). Usado para filtrar visibilidad de deudas
   * de un usuario no-admin.
   */
  findTeamIdsForProfile(profileId: string): Promise<string[]>;

  /**
   * Lee el monto del cargo diario (RN-028, RN-029) desde el contexto del
   * torneo asociado a una deuda, si existe. Devuelve `null` para que el
   * caller use el default global.
   *
   * Hoy `Tournament` no expone un campo dedicado de "overdue daily fee"
   * — esta resolución queda como hook por si en el futuro se agrega
   * (DP / RN-021).
   */
  resolveOverdueDailyAmountForDebt(debtId: string): Promise<number | null>;
}

export const DEBT_CONTEXT = Symbol('DEBT_CONTEXT');
