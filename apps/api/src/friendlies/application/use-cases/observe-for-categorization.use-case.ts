import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../../common/errors';
import {
  FRIENDLY_REPOSITORY,
  FriendlyWithDeposits,
  IFriendlyRepository,
} from '../ports/friendly-repository.port';

export interface ObserveForCategorizationInput {
  friendlyId: string;
}

/**
 * RN-039 — marca un amistoso PLAYED como observado para la categorización
 * de un equipo nuevo. Sólo permitido en estado PLAYED.
 *
 * El status se mantiene PLAYED y se setea el flag `observedForCategorization`
 * en true (no es una transición de status — es metadata adicional). El módulo
 * de Categorización (W1.3) escucha y suma al contador de observaciones del equipo.
 */
@Injectable()
export class ObserveForCategorizationUseCase {
  private readonly logger = new Logger(ObserveForCategorizationUseCase.name);

  constructor(
    @Inject(FRIENDLY_REPOSITORY)
    private readonly repo: IFriendlyRepository,
  ) {}

  async execute(
    input: ObserveForCategorizationInput,
  ): Promise<FriendlyWithDeposits> {
    const record = await this.repo.findById(input.friendlyId);
    if (!record) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Amistoso no encontrado',
        HttpStatus.NOT_FOUND,
        { friendlyId: input.friendlyId },
      );
    }

    if (record.status !== 'PLAYED') {
      throw new BusinessError(
        ErrorCode.FRIENDLY_INVALID_TRANSITION,
        `Sólo se pueden observar amistosos en estado PLAYED (actual: ${record.status})`,
        HttpStatus.CONFLICT,
        { friendlyId: record.id, status: record.status },
      );
    }

    if (record.observedForCategorization) {
      return record; // idempotente
    }

    const updated = await this.repo.updateState(record.id, {
      observedForCategorization: true,
    });

    this.logger.log(
      `Friendly ${record.id} — marcado para categorización (RN-039)`,
    );

    return updated;
  }
}
