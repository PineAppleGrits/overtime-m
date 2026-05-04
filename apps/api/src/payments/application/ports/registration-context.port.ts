/**
 * Puerto que el módulo Payments usa para consultar info mínima de Registration
 * sin importar `RegistrationsModule`. Lo necesitan los use-cases:
 * - `CreateCheckoutUseCase`: para construir título/descripción legacy.
 * - `RegistrationPaymentsService`: para crear las debts de inscripción/seguro
 *   (RN-015) en base al roster.
 */

export interface RegistrationSummary {
  id: string;
  status: string;
  teamId: string;
  tournamentId: string;
  categoryId: string;
  team: { id: string; name: string };
  tournament: {
    id: string;
    name: string;
    sportId: string;
    insurancePerPlayer: number | null;
  };
  category: { id: string; name: string };
  rosterProfileIds: string[];
}

export interface RegistrationPaymentSnapshot {
  registrationId: string;
  /** Pricing del torneo / fee de inscripción (si está configurado). */
  entryFee: { amount: number; currency: string } | null;
  /** Seguros por jugador (uno por miembro del roster). */
  insurancePerPlayer: number | null;
}

export interface IRegistrationContextPort {
  getById(registrationId: string): Promise<RegistrationSummary | null>;
  /**
   * Marca la `Registration` como pagada (legacy, RN-015 lo gestiona vía
   * RegistrationPaymentsService). Mantiene compatibilidad con el flow
   * actual del FE que pinta `status='pagada'`.
   */
  markPaid(registrationId: string): Promise<void>;
}

export const REGISTRATION_CONTEXT_PORT = Symbol('REGISTRATION_CONTEXT_PORT');
