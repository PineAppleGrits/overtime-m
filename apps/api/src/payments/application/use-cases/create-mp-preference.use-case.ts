import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  IMercadoPagoPort,
  MERCADOPAGO_PORT,
} from '../ports/mercadopago.port';
import {
  IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../ports/payment-repository.port';

export interface CreateMpPreferenceInput {
  paymentId: string;
}

export interface CreateMpPreferenceResult {
  paymentId: string;
  preferenceId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
}

/**
 * Crea/recrea la preferencia de MP para un Payment ya creado. Endpoint legacy:
 * `POST /payments/:id/mercadopago/preference`. El FE lo usa cuando el checkout
 * falló y quiere reintentar.
 */
@Injectable()
export class CreateMpPreferenceUseCase {
  private readonly logger = new Logger(CreateMpPreferenceUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly repo: IPaymentRepository,
    @Inject(MERCADOPAGO_PORT)
    private readonly mp: IMercadoPagoPort,
  ) {}

  async execute(
    input: CreateMpPreferenceInput,
  ): Promise<CreateMpPreferenceResult> {
    const payment = await this.repo.findById(input.paymentId);
    if (!payment) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Pago no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
    if (payment.method !== 'mercadopago') {
      throw new BusinessError(
        ErrorCode.PAYMENT_METHOD_INVALID,
        'El método del pago no es MercadoPago',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (payment.status === 'procesado') {
      throw new BusinessError(
        ErrorCode.CONFLICT,
        'El pago ya está completado',
        HttpStatus.CONFLICT,
      );
    }

    let title = 'Pago Overtime';
    let description = '';
    if (payment.registration) {
      title = `Inscripción: ${payment.registration.team.name}`;
      description = `Inscripción al torneo ${payment.registration.tournament.name}`;
    } else if (payment.match) {
      title = `Partido: ${payment.match.homeTeam?.name ?? 'TBD'} vs ${payment.match.awayTeam?.name ?? 'TBD'}`;
      description = 'Pago de partido';
    } else if (payment.debt) {
      title = `Pago: ${payment.debt.concept}`;
      description = `Deuda tipo ${payment.debt.type}`;
    }

    const result = await this.mp.createPreference({
      paymentId: payment.id,
      title,
      description,
      amount: payment.amount,
      currency: payment.currency,
      payerEmail: payment.profile?.email ?? '',
      payerName: payment.profile?.name,
      externalReference: payment.id,
      metadata: {
        registrationId: payment.registrationId,
        matchId: payment.matchId,
        debtId: payment.debtId,
      },
    });

    if (!result.success) {
      throw new BusinessError(
        ErrorCode.CONFLICT,
        `No se pudo crear preferencia: ${result.error}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    await this.repo.update(payment.id, {
      providerPaymentId: result.preferenceId ?? null,
      status: 'pendiente',
    });

    this.logger.log(
      `MP preference recreada para payment ${payment.id}: ${result.preferenceId}`,
    );

    return {
      paymentId: payment.id,
      preferenceId: result.preferenceId,
      initPoint: result.initPoint,
      sandboxInitPoint: result.sandboxInitPoint,
    };
  }
}
