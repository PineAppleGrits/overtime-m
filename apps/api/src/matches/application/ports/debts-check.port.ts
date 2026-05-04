export const DEBTS_CHECK_PORT = Symbol('DEBTS_CHECK_PORT');

/**
 * Puerto para chequear deudas pendientes (RN-053).
 *
 * El módulo Matches no depende directamente de DebtsService — depende de
 * este contrato. La implementación inyecta `DebtsService` y delega.
 *
 * `allowFiftyPercentRule` está reservado para DP-006. Mientras tanto el
 * default es false (regla estricta de RN-053).
 */
export interface IDebtsCheckPort {
  hasOutstandingDebts(
    teamId: string,
    options?: { allowFiftyPercentRule?: boolean; now?: Date },
  ): Promise<boolean>;
}
