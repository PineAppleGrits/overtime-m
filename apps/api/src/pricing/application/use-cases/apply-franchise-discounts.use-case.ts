import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';

export interface ApplyFranchiseDiscountsInput {
  franchiseId: string;
  triggeredByProfileId: string;
}

/**
 * RN-012 — descuento por franquicia con N equipos inscriptos.
 *
 * BLOCKED por DP-011 (valores N y X sin definir). Por ahora lanza un error
 * `FRANCHISE_DISCOUNT_NOT_IMPLEMENTED` (HTTP 501) con detalle de la decisión
 * pendiente. El endpoint se mantiene para que admin pueda dispararlo cuando
 * se implemente.
 *
 * TODO: DP-011 — definir N (cantidad de equipos para gatillar) y X (% o monto fijo).
 *  Cuando se cierre la decisión, este use-case debería:
 *    1. Listar inscripciones aprobadas de la franquicia.
 *    2. Si count >= N, calcular descuento (X% o monto fijo) por equipo o agregado.
 *    3. Aplicar descuentos via `ApplyDiscountUseCase` por cada equipo elegible.
 */
@Injectable()
export class ApplyFranchiseDiscountsUseCase {
  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(input: ApplyFranchiseDiscountsInput): Promise<never> {
    // TODO: DP-011 — implementar lógica completa.
    throw new BusinessError(
      ErrorCode.FRANCHISE_DISCOUNT_NOT_IMPLEMENTED,
      'Descuento por franquicia pendiente — DP-011',
      HttpStatus.NOT_IMPLEMENTED,
      {
        franchiseId: input.franchiseId,
        triggeredByProfileId: input.triggeredByProfileId,
        decision: 'DP-011',
        notes:
          'Falta cerrar valores N (cantidad de equipos) y X (% o monto fijo). Ver docs/pending-decisions.md.',
      },
    );
  }
}
