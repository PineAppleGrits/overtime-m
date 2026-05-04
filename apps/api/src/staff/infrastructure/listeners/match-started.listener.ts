import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import { PrismaService } from '../../../database/prisma.service';
import { CreateMatchPhotoFolderUseCase } from '../../application/use-cases/create-match-photo-folder.use-case';
import {
  IMatchContextPort,
  MATCH_CONTEXT_PORT,
} from '../../application/ports/match-context.port';

/**
 * RN-051 — Cuando un partido inicia (`match.started`), si tiene fotógrafo
 * asignado, crear automáticamente la carpeta de Google Drive.
 *
 * El use-case necesita un `createdByProfileId` para dejar el `MatchAnnouncement`.
 * Resolución (best-effort):
 * 1. Si el fotógrafo asignado tiene `Staff.profileId` no nulo, usamos ese.
 * 2. Caso contrario, intentamos un admin (rol='admin') como fallback.
 * 3. Si tampoco hay, omitimos la creación con warning (RN-051 requiere
 *    profile válido por la FK).
 */
@Injectable()
export class MatchStartedListener {
  private readonly logger = new Logger(MatchStartedListener.name);

  constructor(
    private readonly createPhotoFolder: CreateMatchPhotoFolderUseCase,
    @Inject(MATCH_CONTEXT_PORT)
    private readonly matchCtx: IMatchContextPort,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(DomainEvent.MATCH_STARTED)
  async onMatchStarted(
    payload: DomainEventPayloads['match.started'],
  ): Promise<void> {
    try {
      const ctx = await this.matchCtx.getMatchPhotoFolderContext(payload.matchId);
      if (!ctx) {
        this.logger.warn(
          `match.started recibido pero match ${payload.matchId} no encontrado`,
        );
        return;
      }
      if (!ctx.photographerStaffId) {
        this.logger.log(
          `Match ${payload.matchId} iniciado sin fotógrafo asignado — sin carpeta Drive (RN-051)`,
        );
        return;
      }

      const createdByProfileId = await this.resolveCreatorProfileId(
        ctx.photographerStaffId,
      );
      if (!createdByProfileId) {
        this.logger.warn(
          `No se pudo resolver profileId para crear MatchAnnouncement del fotógrafo (match=${payload.matchId})`,
        );
        return;
      }

      await this.createPhotoFolder.execute({
        matchId: payload.matchId,
        createdByProfileId,
      });
    } catch (err) {
      const e = err as Error;
      this.logger.error(
        `Error creando carpeta Drive para match ${payload.matchId}: ${e.message}`,
        e.stack,
      );
    }
  }

  private async resolveCreatorProfileId(
    photographerStaffId: string,
  ): Promise<string | null> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: photographerStaffId },
      select: { profileId: true },
    });
    if (staff?.profileId) return staff.profileId;

    // Fallback: cualquier admin disponible (decisión: el comunicado igual queda
    // creado bajo un admin, lo importante es persistir el folderUrl).
    const admin = await this.prisma.profile.findFirst({
      where: { role: 'admin' },
      select: { id: true },
    });
    return admin?.id ?? null;
  }
}
