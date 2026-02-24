import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  MarkAsPaidDto,
  PaymentMethod,
  PaymentStatus,
} from '@overtime-mono/shared';
import { CreateCheckoutDto } from '@overtime-mono/shared';
import { PaginationDto } from '@overtime-mono/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe, ParseOptionalUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * ENDPOINT PRINCIPAL PARA FRONTEND
   * Crea un pago y devuelve el link de MercadoPago para redirigir
   */
  @Post('checkout')
  @ApiOperation({
    summary: 'Crear checkout de MercadoPago',
    description: `
Crea un pago y devuelve el link de checkout de MercadoPago.

**Flujo:**
1. Frontend llama a este endpoint
2. Backend crea el pago y obtiene link de MP
3. Frontend redirige al usuario a \`checkoutUrl\`
4. Usuario paga en MercadoPago
5. MercadoPago redirige a tu URL de success/failure/pending
6. Frontend muestra pantalla de "procesando" y hace polling a GET /payments/:id/status
7. Cuando status sea "procesado" o "fallido", mostrar resultado

**Ejemplo de respuesta:**
\`\`\`json
{
  "paymentId": "uuid",
  "checkoutUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=xxx",
  "sandboxUrl": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=xxx",
  "preferenceId": "xxx",
  "amount": 5000,
  "currency": "ARS",
  "expiresAt": "2024-01-01T00:00:00.000Z"
}
\`\`\`
    `,
  })
  createCheckout(
    @Body() createCheckoutDto: CreateCheckoutDto,
    @CurrentUser('id') profileId: string,
  ) {
    return this.paymentsService.createCheckout(createCheckoutDto, profileId);
  }

  /**
   * ENDPOINT PARA POLLING DESDE FRONTEND
   * Obtiene el estado actual de un pago
   */
  @Get(':id/status')
  @ApiOperation({
    summary: 'Obtener estado de pago (para polling)',
    description: `
Endpoint optimizado para que el frontend haga polling mientras espera confirmación de MercadoPago.

**Estados posibles:**
- \`pendiente\`: Esperando pago
- \`procesando\`: MercadoPago está procesando
- \`procesado\`: Pago exitoso ✅
- \`fallido\`: Pago rechazado ❌
- \`reembolsado\`: Pago devuelto

**Recomendación:** Hacer polling cada 2-3 segundos hasta que \`statusInfo.isTerminal\` sea \`true\`
    `,
  })
  getPaymentStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.getPaymentStatus(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un pago (uso interno)' })
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser('id') profileId: string,
  ) {
    return this.paymentsService.create(createPaymentDto, profileId);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar pagos (admin)' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'method', required: false, enum: PaymentMethod })
  @ApiQuery({ name: 'registrationId', required: false })
  @ApiQuery({ name: 'matchId', required: false })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: PaymentStatus,
    @Query('method') method?: PaymentMethod,
    @Query('registrationId', ParseOptionalUUIDPipe) registrationId?: string,
    @Query('matchId', ParseOptionalUUIDPipe) matchId?: string,
  ) {
    return this.paymentsService.findAll(paginationDto, {
      status,
      method,
      registrationId,
      matchId,
    });
  }

  @Get('summary')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener resumen de pagos' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.paymentsService.getSummary(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener mis pagos' })
  findMine(
    @CurrentUser('id') profileId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.paymentsService.findByProfile(profileId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un pago' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/mark-paid')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar pago como completado (efectivo/transferencia)' })
  markAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() markAsPaidDto: MarkAsPaidDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.paymentsService.markAsPaid(id, markAsPaidDto, adminId);
  }

  @Post(':id/mark-failed')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar pago como fallido' })
  markAsFailed(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.paymentsService.markAsFailed(id, reason);
  }

  @Post(':id/mercadopago/preference')
  @ApiOperation({ summary: 'Crear preferencia de MercadoPago' })
  createMercadoPagoPreference(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.createMercadoPagoPreference(id);
  }

  @Get('mercadopago/status')
  @ApiOperation({ summary: 'Verificar si MercadoPago está habilitado' })
  getMercadoPagoStatus() {
    return {
      enabled: this.paymentsService.isMercadoPagoEnabled(),
    };
  }

  @Post('webhooks/mercadopago')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook de MercadoPago' })
  @ApiHeader({ name: 'x-signature', required: false, description: 'MercadoPago signature' })
  @ApiHeader({ name: 'x-request-id', required: false, description: 'MercadoPago request ID' })
  handleMercadoPagoWebhook(
    @Body() payload: any,
    @Headers('x-signature') xSignature?: string,
    @Headers('x-request-id') xRequestId?: string,
  ) {
    return this.paymentsService.processMercadoPagoWebhook(payload, xSignature, xRequestId);
  }
}
