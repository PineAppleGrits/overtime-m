import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Admin } from '../../../common/decorators/admin.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { ApplyDiscountUseCase } from '../../application/use-cases/apply-discount.use-case';
import { CancelDiscountUseCase } from '../../application/use-cases/cancel-discount.use-case';
import { ListDiscountsUseCase } from '../../application/use-cases/list-discounts.use-case';
import {
  CancelDiscountBodyDto,
  CreateDiscountBodyDto,
} from '../dto/discount.dto';
import { toDiscountResponse } from '../mappers/discount.mapper';

/**
 * RN-020 — endpoints de descuentos manuales.
 *
 * Listado público (admin) por equipo, creación admin-only, cancelación admin-only.
 */
@ApiTags('discounts')
@ApiBearerAuth()
@Controller('discounts')
export class DiscountsController {
  constructor(
    private readonly applyUseCase: ApplyDiscountUseCase,
    private readonly listUseCase: ListDiscountsUseCase,
    private readonly cancelUseCase: CancelDiscountUseCase,
  ) {}

  @Admin()
  @Post()
  @ApiOperation({ summary: 'Aplicar un descuento manual a un equipo (admin)' })
  async create(
    @Body() body: CreateDiscountBodyDto,
    @CurrentUser('id') adminId: string,
  ) {
    const created = await this.applyUseCase.execute({
      teamId: body.teamId,
      amount: body.amount,
      currency: body.currency,
      concept: body.concept,
      notes: body.notes ?? null,
      metadata: body.metadata,
      sourceDebtId: body.sourceDebtId,
      createdByProfileId: adminId,
    });
    return toDiscountResponse(created);
  }

  @Admin()
  @Get()
  @ApiOperation({
    summary:
      'Listar descuentos manuales (admin). Filtrable por `?teamId=` y `?includeCancelled=true`.',
  })
  async list(
    @Query('teamId') teamId?: string,
    @Query('includeCancelled') includeCancelled?: string,
  ) {
    const discounts = await this.listUseCase.execute({
      teamId,
      includeCancelled:
        includeCancelled === 'true' || includeCancelled === '1',
    });
    return discounts.map(toDiscountResponse);
  }

  @Admin()
  @Delete(':id')
  @ApiOperation({
    summary:
      'Cancelar un descuento manual (admin). El descuento queda con status=CANCELLED.',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() body?: CancelDiscountBodyDto,
  ) {
    const cancelled = await this.cancelUseCase.execute({
      discountId: id,
      cancelledByProfileId: adminId,
      reason: body?.reason,
    });
    return toDiscountResponse(cancelled);
  }
}
