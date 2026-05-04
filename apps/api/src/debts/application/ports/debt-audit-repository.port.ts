import { DebtAudit, DebtStatus } from '@prisma/client';

export interface CreateDebtAuditInput {
  debtId: string;
  fromStatus: DebtStatus;
  toStatus: DebtStatus;
  reason?: string | null;
  byProfileId: string;
}

/**
 * Port separado para auditoría — útil en flujos donde se quiere registrar
 * eventos no-status (ej. ajuste manual de monto, anotaciones) sin pasar por
 * `IDebtRepository.changeStatus`. Por ahora `IDebtRepository.changeStatus`
 * crea internamente el audit en una transacción.
 */
export interface IDebtAuditRepository {
  create(input: CreateDebtAuditInput): Promise<DebtAudit>;
  listByDebt(debtId: string): Promise<DebtAudit[]>;
}

export const DEBT_AUDIT_REPOSITORY = Symbol('DEBT_AUDIT_REPOSITORY');
