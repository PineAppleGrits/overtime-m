import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  FRIENDLY_REPOSITORY,
  FriendlyWithDeposits,
  IFriendlyRepository,
} from '../ports/friendly-repository.port';
import {
  FRIENDLY_CONTEXT,
  IFriendlyContext,
} from '../ports/friendly-context.port';

export interface RequestFriendlyInput {
  homeTeamId: string;
  awayTeamId: string;
  modality: '3v3' | '5v5';
  proposedDate: Date;
  venueId?: string | null;
  notes?: string | null;
  /** Profile que dispara la solicitud — desde web (delegado) o admin manual. */
  requestedByProfileId: string;
  /**
   * Cuando es true, no se valida que el solicitante sea delegado de homeTeamId
   * (se asume admin). RN-059 admite ambos canales.
   */
  bypassDelegateCheck?: boolean;
}

/**
 * RN-059 — Solicitar un amistoso.
 *
 * Canales soportados:
 * - Web (formulario): delegado del homeTeamId crea la solicitud.
 * - Admin manual (WhatsApp/etc): admin crea la solicitud en nombre del equipo.
 *
 * Crea Friendly con status=REQUESTED, valida que ambos equipos sean del mismo
 * deporte, emite `friendly.requested`.
 */
@Injectable()
export class RequestFriendlyUseCase {
  private readonly logger = new Logger(RequestFriendlyUseCase.name);

  constructor(
    @Inject(FRIENDLY_REPOSITORY)
    private readonly repo: IFriendlyRepository,
    @Inject(FRIENDLY_CONTEXT)
    private readonly context: IFriendlyContext,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: RequestFriendlyInput): Promise<FriendlyWithDeposits> {
    if (input.homeTeamId === input.awayTeamId) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'El equipo local y visitante no pueden ser el mismo',
        HttpStatus.BAD_REQUEST,
      );
    }

    const teams = await this.context.findTeamsByIds([
      input.homeTeamId,
      input.awayTeamId,
    ]);
    if (teams.length !== 2) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        'Uno o ambos equipos no existen',
        HttpStatus.NOT_FOUND,
        {
          homeTeamId: input.homeTeamId,
          awayTeamId: input.awayTeamId,
        },
      );
    }

    const home = teams.find((t) => t.id === input.homeTeamId)!;
    const away = teams.find((t) => t.id === input.awayTeamId)!;

    if (home.sportId !== away.sportId) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'Ambos equipos deben pertenecer al mismo deporte',
        HttpStatus.BAD_REQUEST,
        { homeSportId: home.sportId, awaySportId: away.sportId },
      );
    }

    if (!input.bypassDelegateCheck) {
      const isDelegate = await this.context.isDelegateOfTeam(
        input.requestedByProfileId,
        input.homeTeamId,
      );
      if (!isDelegate) {
        throw new BusinessError(
          ErrorCode.FORBIDDEN,
          'Sólo el delegado del equipo local puede solicitar el amistoso',
          HttpStatus.FORBIDDEN,
          { teamId: input.homeTeamId },
        );
      }
    }

    const friendly = await this.repo.create({
      sportId: home.sportId,
      modality: input.modality,
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      proposedDate: input.proposedDate,
      venueId: input.venueId ?? null,
      notes: input.notes ?? null,
      status: 'REQUESTED',
      createdByProfileId: input.requestedByProfileId,
    });

    const payload: DomainEventPayloads['friendly.requested'] = {
      friendlyId: friendly.id,
      createdBy: input.requestedByProfileId,
    };
    this.eventEmitter.emit(DomainEvent.FRIENDLY_REQUESTED, payload);

    this.logger.log(
      `Friendly requested: ${friendly.id} (${home.name} vs ${away.name})`,
    );

    return friendly;
  }
}
