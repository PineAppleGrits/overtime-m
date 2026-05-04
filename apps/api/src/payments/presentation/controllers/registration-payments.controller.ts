import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { RegistrationPaymentsService } from '../../application/services/registration-payments.service';

/**
 * Endpoints adicionales en el módulo Payments que viven bajo `/registrations`.
 *
 * RN-015 / RN-016 — el FE consulta acá el estado consolidado de pago
 * (entry fee + insurances) sin tener que ir a `/api/v1/debts` y reconciliar.
 */
@ApiTags('registration-payments')
@ApiBearerAuth('access-token')
@Controller('registrations')
export class RegistrationPaymentsController {
  constructor(
    private readonly registrationPayments: RegistrationPaymentsService,
  ) {}

  @Get(':id/payment-status')
  @ApiOperation({
    summary:
      'Estado de pago de la inscripción (RN-015/RN-016) — entry fee + insurances + status agregado.',
  })
  getPaymentStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationPayments.getRegistrationPaymentStatus(id);
  }
}
