import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Admin } from '../../../common/decorators/admin.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import {
  isPaymentMethod,
  PaymentMethod,
} from '../../domain/rules/payment-method.rules';
import { CreatePricingPeriodUseCase } from '../../application/use-cases/create-pricing-period.use-case';
import { DeletePricingPeriodUseCase } from '../../application/use-cases/delete-pricing-period.use-case';
import { GetCurrentPricingUseCase } from '../../application/use-cases/get-current-pricing.use-case';
import { ListPricingPeriodsUseCase } from '../../application/use-cases/list-pricing-periods.use-case';
import { UpdatePricingPeriodUseCase } from '../../application/use-cases/update-pricing-period.use-case';
import {
  CreatePricingPeriodBodyDto,
  UpdatePricingPeriodBodyDto,
} from '../dto/pricing.dto';
import { toPricingPeriodResponse } from '../mappers/pricing.mapper';

/**
 * RN-048 — endpoints CRUD de períodos de pricing por torneo, con awareness
 * de la dimensión `paymentMethod`.
 *
 * Reemplaza al controller equivalente de W1.1 sumando el query/body param
 * `paymentMethod`. La ruta es la misma (`/api/v1/tournaments/:id/pricing`).
 */
@ApiTags('tournaments')
@Controller('tournaments/:tournamentId/pricing')
export class TournamentPricingController {
  constructor(
    private readonly listUseCase: ListPricingPeriodsUseCase,
    private readonly createUseCase: CreatePricingPeriodUseCase,
    private readonly updateUseCase: UpdatePricingPeriodUseCase,
    private readonly deleteUseCase: DeletePricingPeriodUseCase,
    private readonly currentUseCase: GetCurrentPricingUseCase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Listar períodos de precio del torneo (RN-048). Filtrable por `?method=`.',
  })
  @ApiQuery({
    name: 'method',
    required: false,
    enum: ['cash', 'transfer', 'card'],
  })
  async list(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Query('method') method?: string,
  ) {
    const periods = await this.listUseCase.execute({
      tournamentId,
      paymentMethod: this.parseMethod(method),
    });
    return periods.map(toPricingPeriodResponse);
  }

  @Public()
  @Get('current')
  @ApiOperation({
    summary:
      'Obtener el precio vigente. Si se pasa `?method=`, prioriza match exacto y cae al fallback (sin método).',
  })
  @ApiQuery({
    name: 'method',
    required: false,
    enum: ['cash', 'transfer', 'card'],
  })
  async current(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Query('method') method?: string,
  ) {
    const period = await this.currentUseCase.execute({
      tournamentId,
      paymentMethod: this.parseMethod(method) ?? null,
    });
    return period ? toPricingPeriodResponse(period) : null;
  }

  @Admin()
  @Post()
  @ApiOperation({ summary: 'Crear un período de precio (admin)' })
  async create(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Body() body: CreatePricingPeriodBodyDto,
  ) {
    const created = await this.createUseCase.execute({
      tournamentId,
      validFrom: new Date(body.validFrom),
      validTo: new Date(body.validTo),
      entryFeeAmount: body.entryFeeAmount,
      currency: body.currency,
      paymentMethod: body.paymentMethod ?? null,
    });
    return toPricingPeriodResponse(created);
  }

  @Admin()
  @Patch(':pricingId')
  @ApiOperation({ summary: 'Actualizar un período de precio (admin)' })
  async update(
    @Param('tournamentId', ParseUUIDPipe) _tournamentId: string,
    @Param('pricingId', ParseUUIDPipe) pricingId: string,
    @Body() body: UpdatePricingPeriodBodyDto,
  ) {
    const updated = await this.updateUseCase.execute({
      pricingId,
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      validTo: body.validTo ? new Date(body.validTo) : undefined,
      entryFeeAmount: body.entryFeeAmount,
      currency: body.currency,
      paymentMethod: body.paymentMethod,
    });
    return toPricingPeriodResponse(updated);
  }

  @Admin()
  @Delete(':pricingId')
  @ApiOperation({ summary: 'Eliminar un período de precio (admin)' })
  remove(
    @Param('tournamentId', ParseUUIDPipe) _tournamentId: string,
    @Param('pricingId', ParseUUIDPipe) pricingId: string,
  ) {
    return this.deleteUseCase.execute(pricingId);
  }

  private parseMethod(value?: string): PaymentMethod | undefined {
    if (value === undefined || value === '') return undefined;
    if (!isPaymentMethod(value)) {
      throw new BusinessError(
        ErrorCode.PRICING_INVALID_PAYMENT_METHOD,
        `Método de pago inválido: '${value}'. Valores válidos: cash, transfer, card.`,
        HttpStatus.BAD_REQUEST,
        { method: value },
      );
    }
    return value;
  }
}
