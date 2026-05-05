import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { Sanction } from '../../domain/entities/sanction.entity';
import {
  ISanctionRepository,
  SANCTION_REPOSITORY,
} from '../ports/sanction-repository.port';

export interface CancelSanctionInput {
  sanctionId: string;
  cancelledByProfileId: string;
  cancellationNotes?: string;
}

@Injectable()
export class CancelSanctionUseCase {
  private readonly logger = new Logger(CancelSanctionUseCase.name);

  constructor(
    @Inject(SANCTION_REPOSITORY)
    private readonly repo: ISanctionRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: CancelSanctionInput): Promise<Sanction> {
    const sanction = await this.repo.findById(input.sanctionId);
    if (!sanction) {
      throw new BusinessError(
        ErrorCode.SANCTION_NOT_FOUND,
        'Sanción no encontrada',
        HttpStatus.NOT_FOUND,
        { sanctionId: input.sanctionId },
      );
    }
    try {
      sanction.markCancelled({
        cancelledByProfileId: input.cancelledByProfileId,
        cancellationNotes: input.cancellationNotes,
      });
    } catch (err) {
      throw new BusinessError(
        ErrorCode.SANCTION_INVALID_TRANSITION,
        (err as Error).message,
        HttpStatus.CONFLICT,
        { sanctionId: input.sanctionId },
      );
    }
    const saved = await this.repo.save(sanction);
    const payload: DomainEventPayloads['sanction.cancelled'] = {
      sanctionId: input.sanctionId,
      cancelledBy: input.cancelledByProfileId,
    };
    this.eventEmitter.emit(DomainEvent.SANCTION_CANCELLED, payload);
    this.logger.log(`Sanción cancelada: ${input.sanctionId}`);
    return saved;
  }
}
