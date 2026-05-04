import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Admin } from '../../../common/decorators/admin.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { ApplyFranchiseDiscountsUseCase } from '../../application/use-cases/apply-franchise-discounts.use-case';

/**
 * RN-012 — endpoint admin para disparar el cálculo de descuentos por franquicia.
 *
 * BLOCKED por DP-011. Por ahora retorna 501 con detalle de la decisión pendiente.
 *
 * TODO: DP-011 — implementar cuando se cierren N (cant equipos) y X (% o monto).
 */
@ApiTags('franchises')
@ApiBearerAuth()
@Controller('franchises/:franchiseId')
export class FranchiseDiscountsController {
  constructor(
    private readonly applyFranchiseDiscounts: ApplyFranchiseDiscountsUseCase,
  ) {}

  @Admin()
  @Post('apply-discounts')
  @HttpCode(501)
  @ApiOperation({
    summary:
      '[STUB — DP-011 abierta] Calcular y aplicar descuentos por franquicia (RN-012). Retorna 501 hasta que se defina la regla.',
  })
  async applyDiscounts(
    @Param('franchiseId', ParseUUIDPipe) franchiseId: string,
    @CurrentUser('id') adminId: string,
  ) {
    return this.applyFranchiseDiscounts.execute({
      franchiseId,
      triggeredByProfileId: adminId,
    });
  }
}
