import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { Sanction } from '../../domain/entities/sanction.entity';
import {
  ISanctionRepository,
  SANCTION_REPOSITORY,
} from '../ports/sanction-repository.port';

export interface ResolveSanctionInput {
  sanctionId: string;
  resolvedByProfileId: string;
  resolutionNotes?: string;
}

@Injectable()
export class ResolveSanctionUseCase {
  private readonly logger = new Logger(ResolveSanctionUseCase.name);

  constructor(
    @Inject(SANCTION_REPOSITORY)
    private readonly repo: ISanctionRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: ResolveSanctionInput): Promise<Sanction> {
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
      sanction.markResolved({
        resolvedByProfileId: input.resolvedByProfileId,
        resolutionNotes: input.resolutionNotes,
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
    const payload: DomainEventPayloads['sanction.resolved'] = {
      sanctionId: input.sanctionId,
      resolvedBy: input.resolvedByProfileId,
    };
    this.eventEmitter.emit(DomainEvent.SANCTION_RESOLVED, payload);
    this.logger.log(`Sanción resuelta: ${input.sanctionId}`);
    return saved;
  }
}
