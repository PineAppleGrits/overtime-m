import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BlacklistEntry } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  BLACKLIST_REPOSITORY,
  IBlacklistRepository,
} from '../ports/blacklist-repository.port';

export interface LiftBlacklistEntryInput {
  blacklistId: string;
  liftedByProfileId: string;
  resolutionNotes?: string;
}

@Injectable()
export class LiftBlacklistEntryUseCase {
  private readonly logger = new Logger(LiftBlacklistEntryUseCase.name);

  constructor(
    @Inject(BLACKLIST_REPOSITORY)
    private readonly repo: IBlacklistRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: LiftBlacklistEntryInput): Promise<BlacklistEntry> {
    const entry = await this.repo.findById(input.blacklistId);
    if (!entry) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Blacklist no encontrada',
        HttpStatus.NOT_FOUND,
        { blacklistId: input.blacklistId },
      );
    }
    if (entry.status !== 'ACTIVE') {
      throw new BusinessError(
        ErrorCode.BLACKLIST_NOT_ACTIVE,
        'La blacklist no está activa',
        HttpStatus.CONFLICT,
        { blacklistId: input.blacklistId },
      );
    }
    const updated = await this.repo.lift({
      id: input.blacklistId,
      liftedByProfileId: input.liftedByProfileId,
      resolutionNotes: input.resolutionNotes,
    });
    const payload: DomainEventPayloads['blacklist.lifted'] = {
      blacklistId: updated.id,
      liftedBy: input.liftedByProfileId,
    };
    this.eventEmitter.emit(DomainEvent.BLACKLIST_LIFTED, payload);
    this.logger.log(`Blacklist liftada: ${updated.id}`);
    return updated;
  }
}
