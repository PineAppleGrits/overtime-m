import { Prisma } from '@prisma/client';
import {
  PaymentMethodValue,
  isValidPaymentMethod,
  normalizeMethod,
  requiresProof,
  shouldAutoDeleteProof,
} from '../rules/method-validation.rules';
import {
  PaymentStatusValue,
  isApprovableStatus,
  isTerminalPaymentStatus,
  isValidPaymentTransition,
} from '../rules/transitions.rules';

/**
 * Snapshot inmutable de un Payment. Refleja columnas relevantes de la tabla;
 * la persistencia completa la maneja Prisma vía repositorio.
 *
 * Decisión: el schema declara `Payment.amount` como `Float` (no Decimal). Para
 * preservar precisión decimal en operaciones, dentro del dominio trabajamos con
 * `Prisma.Decimal` y convertimos a `number` solamente en el límite de
 * persistencia.
 */
export interface PaymentState {
  id: string;
  debtId: string | null;
  registrationId: string | null;
  matchId: string | null;
  profileId: string;
  amount: Prisma.Decimal;
  currency: string;
  method: PaymentMethodValue;
  status: PaymentStatusValue;
  providerPaymentId: string | null;
  providerResponse: Prisma.JsonValue | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovePaymentResult {
  newStatus: PaymentStatusValue;
  processedAt: Date;
}

/**
 * Entidad de dominio Payment. Encapsula las transiciones legales y las
 * validaciones de método/estado.
 */
export class Payment {
  private constructor(private readonly state: PaymentState) {}

  static fromState(state: PaymentState): Payment {
    return new Payment(state);
  }

  get id(): string {
    return this.state.id;
  }

  get status(): PaymentStatusValue {
    return this.state.status;
  }

  get method(): PaymentMethodValue {
    return this.state.method;
  }

  get amount(): Prisma.Decimal {
    return this.state.amount;
  }

  get debtId(): string | null {
    return this.state.debtId;
  }

  get registrationId(): string | null {
    return this.state.registrationId;
  }

  get matchId(): string | null {
    return this.state.matchId;
  }

  get profileId(): string {
    return this.state.profileId;
  }

  toState(): PaymentState {
    return { ...this.state };
  }

  isTerminal(): boolean {
    return isTerminalPaymentStatus(this.state.status);
  }

  isApproved(): boolean {
    return this.state.status === 'procesado';
  }

  isApprovable(): boolean {
    return isApprovableStatus(this.state.status);
  }

  canTransitionTo(target: PaymentStatusValue): boolean {
    return isValidPaymentTransition(this.state.status, target);
  }

  canBeApproved(): boolean {
    return isApprovableStatus(this.state.status);
  }

  /**
   * RN-014 — ¿Este payment requiere comprobante adjunto?
   */
  requiresProof(): boolean {
    return requiresProof(this.state.method);
  }

  /**
   * RN-060 — ¿El comprobante de este payment debe borrarse 3 días post-aprobación?
   */
  shouldAutoDeleteProof(): boolean {
    return shouldAutoDeleteProof(this.state.method);
  }

  /**
   * Marca el payment como aprobado. NO actualiza Debt — eso lo hace W2.1
   * (DebtsService.applyPayment) en el use-case de aprobación.
   */
  markPaid(now: Date = new Date()): ApprovePaymentResult {
    if (!this.canTransitionTo('procesado')) {
      throw new Error(
        `Transición inválida ${this.state.status} → procesado en payment ${this.state.id}`,
      );
    }
    return { newStatus: 'procesado', processedAt: now };
  }

  /**
   * Marca el payment como fallido.
   */
  markFailed(): ApprovePaymentResult {
    if (!this.canTransitionTo('fallido')) {
      throw new Error(
        `Transición inválida ${this.state.status} → fallido en payment ${this.state.id}`,
      );
    }
    return { newStatus: 'fallido', processedAt: this.state.processedAt ?? new Date() };
  }

  static normalizeMethod(method: string): PaymentMethodValue {
    if (!isValidPaymentMethod(method)) {
      throw new Error(`Método de pago inválido: ${method}`);
    }
    return normalizeMethod(method);
  }
}
