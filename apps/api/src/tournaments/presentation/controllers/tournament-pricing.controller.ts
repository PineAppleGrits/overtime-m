import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Admin } from '../../../common/decorators/admin.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
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
    summary: 'Listar períodos de precio de inscripción del torneo (RN-048)',
  })
  async list(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    const periods = await this.listUseCase.execute(tournamentId);
    return periods.map(toPricingPeriodResponse);
  }

  @Public()
  @Get('current')
  @ApiOperation({ summary: 'Obtener el precio vigente al instante actual' })
  async current(@Param('tournamentId', ParseUUIDPipe) tournamentId: string) {
    const period = await this.currentUseCase.execute(tournamentId);
    return period ? toPricingPeriodResponse(period) : null;
  }

  @Admin()
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo período de precio (admin)' })
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
}
