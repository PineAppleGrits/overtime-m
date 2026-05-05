import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { Sanction } from '../../domain/entities/sanction.entity';
import {
  CreateSanctionInput,
  ISanctionRepository,
  SANCTION_REPOSITORY,
} from '../ports/sanction-repository.port';

export type CreateSanctionUseCaseInput = CreateSanctionInput;

@Injectable()
export class CreateSanctionUseCase {
  private readonly logger = new Logger(CreateSanctionUseCase.name);

  constructor(
    @Inject(SANCTION_REPOSITORY)
    private readonly repo: ISanctionRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: CreateSanctionUseCaseInput): Promise<Sanction> {
    if (input.targetType === 'PROFILE' && !input.targetProfileId) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'targetProfileId es requerido para sanciones de jugador',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (input.targetType === 'TEAM' && !input.targetTeamId) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'targetTeamId es requerido para sanciones de equipo',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      input.startsAt &&
      input.endsAt &&
      input.endsAt.getTime() < input.startsAt.getTime()
    ) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'endsAt debe ser posterior a startsAt',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (input.totalFechas !== undefined) {
      if (!Number.isInteger(input.totalFechas) || input.totalFechas <= 0) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          'totalFechas debe ser un entero > 0',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const sanction = await this.repo.create(input);
    const props = sanction.toProps();
    const payload: DomainEventPayloads['sanction.created'] = {
      sanctionId: props.id,
      targetType: props.targetType,
      targetProfileId: props.targetProfileId ?? undefined,
      targetTeamId: props.targetTeamId ?? undefined,
      kind: props.kind,
      totalFechas: input.totalFechas,
    };
    this.eventEmitter.emit(DomainEvent.SANCTION_CREATED, payload);
    this.logger.log(`Sanción creada: ${props.id}`);
    return sanction;
  }
}
