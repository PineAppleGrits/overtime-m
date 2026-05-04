import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
  PaymentWithRelations,
} from '../ports/payment-repository.port';

export interface PaymentStatusInfo {
  code: string;
  label: string;
  description: string;
  isTerminal: boolean;
  isSuccess: boolean;
}

/**
 * Endpoint usado por el FE para hacer polling tras un checkout MP.
 * Devuelve el status + relaciones que el FE pinta en pantalla de "procesando".
 */
@Injectable()
export class GetPaymentStatusUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
  ) {}

  async execute(paymentId: string): Promise<{
    payment: PaymentWithRelations;
    statusInfo: PaymentStatusInfo;
  }> {
    const payment = await this.repo.findById(paymentId);
    if (!payment) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Pago no encontrado',
        HttpStatus.NOT_FOUND,
        { paymentId },
      );
    }
    return {
      payment,
      statusInfo: mapStatusInfo(payment.status),
    };
  }
}

const STATUS_MAP: Record<string, PaymentStatusInfo> = {
  pendiente: {
    code: 'pending',
    label: 'Pendiente',
    description: 'El pago está pendiente de procesamiento',
    isTerminal: false,
    isSuccess: false,
  },
  procesando: {
    code: 'processing',
    label: 'Procesando',
    description: 'El pago se está procesando',
    isTerminal: false,
    isSuccess: false,
  },
  procesado: {
    code: 'completed',
    label: 'Completado',
    description: 'El pago fue procesado exitosamente',
    isTerminal: true,
    isSuccess: true,
  },
  fallido: {
    code: 'failed',
    label: 'Fallido',
    description: 'El pago no pudo ser procesado',
    isTerminal: true,
    isSuccess: false,
  },
  reembolsado: {
    code: 'refunded',
    label: 'Reembolsado',
    description: 'El pago fue reembolsado',
    isTerminal: true,
    isSuccess: false,
  },
};

function mapStatusInfo(status: string): PaymentStatusInfo {
  return STATUS_MAP[status] ?? STATUS_MAP['pendiente'];
}
