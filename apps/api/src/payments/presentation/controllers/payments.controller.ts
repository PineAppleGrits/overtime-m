import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationDto } from '@overtime-mono/shared';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  ParseOptionalUUIDPipe,
  ParseUUIDPipe,
} from '../../../common/pipes/parse-uuid.pipe';
import { PaymentsService } from '../../application/services/payments.service';
import {
  CreateCheckoutBodyDto,
  CreatePaymentBodyDto,
  MarkAsFailedBodyDto,
  MarkAsPaidBodyDto,
} from '../dto/payment-request.dto';
import { toPaymentResponseDto } from '../mappers/payment.mapper';

interface UploadedFileShape {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@ApiTags('payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiOperation({
    summary: 'Crear checkout de MercadoPago (resource: debt | registration | match)',
    description: `
Crea un Payment status=pendiente y devuelve el link de checkout de MercadoPago.

**type=debt** (preferido — RN-013/-022): pasa \`debtId\`, el monto = currentBalance.
**type=registration** (legacy): pasa \`registrationId\`.
**type=match** (legacy): pasa \`matchId\`.
    `,
  })
  async createCheckout(
    @Body() body: CreateCheckoutBodyDto,
    @CurrentUser('id') profileId: string,
  ) {
    if (body.type === 'debt') {
      return this.paymentsService.createCheckout({
        resource: { kind: 'debt', debtId: body.debtId! },
        profileId,
      });
    }
    if (body.type === 'registration') {
      return this.paymentsService.createCheckout({
        resource: { kind: 'registration', registrationId: body.registrationId! },
        profileId,
      });
    }
    return this.paymentsService.createCheckout({
      resource: { kind: 'match', matchId: body.matchId! },
      profileId,
    });
  }

  @Get(':id/status')
  @ApiOperation({
    summary: 'Obtener estado de pago (para polling desde el FE)',
  })
  async getPaymentStatus(@Param('id', ParseUUIDPipe) id: string) {
    const { payment, statusInfo } = await this.paymentsService.getPaymentStatus(id);
    return {
      id: payment.id,
      status: payment.status,
      statusInfo,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      processedAt: payment.processedAt
        ? payment.processedAt.toISOString()
        : null,
      createdAt: payment.createdAt.toISOString(),
      registration: payment.registration,
      match: payment.match,
      debt: payment.debt
        ? {
            ...payment.debt,
            currentBalance: payment.debt.currentBalance.toString(),
            originAmount: payment.debt.originAmount.toString(),
          }
        : null,
      providerDetails: payment.providerResponse
        ? {
            statusDescription: (payment.providerResponse as { statusDescription?: string })
              ?.statusDescription,
          }
        : null,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Crear un pago (uso interno)' })
  async create(
    @Body() body: CreatePaymentBodyDto,
    @CurrentUser('id') profileId: string,
  ) {
    const payment = await this.paymentsService.create({
      profileId,
      debtId: body.debtId,
      registrationId: body.registrationId,
      matchId: body.matchId,
      amount: body.amount,
      currency: body.currency,
      method: body.method,
    });
    return toPaymentResponseDto(payment);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Listar pagos (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'method', required: false })
  @ApiQuery({ name: 'registrationId', required: false })
  @ApiQuery({ name: 'matchId', required: false })
  @ApiQuery({ name: 'debtId', required: false })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('registrationId', ParseOptionalUUIDPipe) registrationId?: string,
    @Query('matchId', ParseOptionalUUIDPipe) matchId?: string,
    @Query('debtId', ParseOptionalUUIDPipe) debtId?: string,
  ) {
    const result = await this.paymentsService.findAll({
      page: paginationDto.page,
      limit: paginationDto.limit,
      sortBy: paginationDto.sortBy,
      sortOrder: paginationDto.sortOrder,
      status: status as never,
      method: method as never,
      registrationId,
      matchId,
      debtId,
    });
    return {
      data: result.data.map((p) => toPaymentResponseDto(p)),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
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
  async findMine(
    @CurrentUser('id') profileId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.paymentsService.findByProfile(profileId, {
      page: paginationDto.page,
      limit: paginationDto.limit,
    });
    return {
      data: result.data.map((p) => toPaymentResponseDto(p)),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un pago' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const payment = await this.paymentsService.findOne(id);
    return toPaymentResponseDto(payment);
  }

  @Post(':id/mark-paid')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar pago como completado (efectivo/transferencia)' })
  async markAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: MarkAsPaidBodyDto,
    @CurrentUser('id') adminId: string,
  ) {
    const payment = await this.paymentsService.markAsPaid(
      id,
      { externalReference: body.externalReference, notes: body.notes },
      adminId,
    );
    return toPaymentResponseDto(payment);
  }

  @Post(':id/mark-failed')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar pago como fallido' })
  async markAsFailed(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: MarkAsFailedBodyDto,
  ) {
    const payment = await this.paymentsService.markAsFailed(id, body.reason);
    return toPaymentResponseDto(payment);
  }

  @Post(':id/proof')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Sube comprobante de transferencia (RN-014). Campo "file" multipart. Programa borrado al aprobar (RN-060).',
  })
  async uploadProof(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedFileShape,
    @CurrentUser('id') profileId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo "file" requerido');
    }
    const asset = await this.paymentsService.uploadPaymentProof({
      paymentId: id,
      uploadedByProfileId: profileId,
      contentType: file.mimetype,
      originalFilename: file.originalname,
      body: file.buffer,
    });
    return {
      assetId: asset.id,
      paymentId: id,
      contentType: asset.contentType,
      originalFilename: asset.originalFilename,
      sizeBytes: asset.sizeBytes,
      uploadedAt: asset.createdAt.toISOString(),
    };
  }

  @Post(':id/mercadopago/preference')
  @ApiOperation({ summary: 'Crear preferencia de MercadoPago' })
  createMercadoPagoPreference(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.createMercadoPagoPreference(id);
  }

  @Get('mercadopago/status')
  @ApiOperation({ summary: 'Verificar si MercadoPago está habilitado' })
  getMercadoPagoStatus() {
    return { enabled: this.paymentsService.isMercadoPagoEnabled() };
  }

  @Post('webhooks/mercadopago')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook de MercadoPago' })
  @ApiHeader({ name: 'x-signature', required: false })
  @ApiHeader({ name: 'x-request-id', required: false })
  handleMercadoPagoWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers('x-signature') xSignature?: string,
    @Headers('x-request-id') xRequestId?: string,
  ) {
    return this.paymentsService.processMercadoPagoWebhook({
      payload: payload as never,
      xSignature,
      xRequestId,
    });
  }
}
