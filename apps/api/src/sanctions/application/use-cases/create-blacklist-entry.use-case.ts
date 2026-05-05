import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { BlacklistEntry } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { PrismaService } from '../../../database/prisma.service';
import {
  BLACKLIST_REPOSITORY,
  IBlacklistRepository,
} from '../ports/blacklist-repository.port';

export interface CreateBlacklistEntryInput {
  profileId?: string;
  documentNumber?: string;
  profileNameSnapshot?: string;
  reason: string;
  attachmentUrls?: string[];
  blockedByProfileId: string;
}

@Injectable()
export class CreateBlacklistEntryUseCase {
  private readonly logger = new Logger(CreateBlacklistEntryUseCase.name);

  constructor(
    @Inject(BLACKLIST_REPOSITORY)
    private readonly repo: IBlacklistRepository,
    // Necesitamos el Prisma directo para resolver el subject (puede que ya
    // exista un Profile con ese documentNumber).
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: CreateBlacklistEntryInput): Promise<BlacklistEntry> {
    const subject = await this.resolveSubject(input);

    const exists = await this.repo.hasActiveEntry({
      profileId: subject.profileId,
      documentNumber: subject.documentNumber,
    });
    if (exists) {
      throw new BusinessError(
        ErrorCode.BLACKLIST_ALREADY_ACTIVE,
        'Ya existe una entrada activa de blacklist para este sujeto',
        HttpStatus.CONFLICT,
        { documentNumber: subject.documentNumber },
      );
    }

    const created = await this.repo.create({
      profileId: subject.profileId,
      documentNumber: subject.documentNumber,
      profileNameSnapshot: subject.profileNameSnapshot,
      reason: input.reason,
      attachmentUrls: input.attachmentUrls ?? [],
      blockedByProfileId: input.blockedByProfileId,
    });

    if (subject.profileId) {
      await this.repo.deactivateProfileMemberships(subject.profileId);
    }

    const payload: DomainEventPayloads['blacklist.created'] = {
      blacklistId: created.id,
      documentNumber: subject.documentNumber,
      profileId: subject.profileId ?? undefined,
      blockedBy: input.blockedByProfileId,
    };
    this.eventEmitter.emit(DomainEvent.BLACKLIST_CREATED, payload);

    this.logger.log(`Blacklist creada: ${created.id} (doc=${subject.documentNumber})`);
    return created;
  }

  private async resolveSubject(
    input: CreateBlacklistEntryInput,
  ): Promise<{
    profileId?: string;
    documentNumber: string;
    profileNameSnapshot: string;
  }> {
    const norm = (v: string) => v.trim();

    if (input.profileId) {
      const profile = await this.prisma.profile.findUnique({
        where: { id: input.profileId, deletedAt: null },
        select: { id: true, name: true, documentNumber: true },
      });
      if (!profile) {
        throw new BusinessError(
          ErrorCode.NOT_FOUND,
          'Perfil no encontrado',
          HttpStatus.NOT_FOUND,
          { profileId: input.profileId },
        );
      }
      if (!profile.documentNumber) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          'No se puede bloquear un perfil sin documentNumber',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (
        input.documentNumber &&
        norm(input.documentNumber) !== profile.documentNumber
      ) {
        throw new BusinessError(
          ErrorCode.VALIDATION_FAILED,
          'documentNumber no coincide con el perfil',
          HttpStatus.BAD_REQUEST,
        );
      }
      return {
        profileId: profile.id,
        documentNumber: profile.documentNumber,
        profileNameSnapshot: profile.name,
      };
    }

    if (!input.documentNumber) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'documentNumber es requerido cuando no se provee profileId',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!input.profileNameSnapshot) {
      throw new BusinessError(
        ErrorCode.VALIDATION_FAILED,
        'profileNameSnapshot es requerido cuando no se provee profileId',
        HttpStatus.BAD_REQUEST,
      );
    }

    const documentNumber = norm(input.documentNumber);
    const existing = await this.prisma.profile.findFirst({
      where: { documentNumber, deletedAt: null },
      select: { id: true, name: true },
    });

    return {
      profileId: existing?.id,
      documentNumber,
      profileNameSnapshot: existing?.name ?? input.profileNameSnapshot,
    };
  }
}
