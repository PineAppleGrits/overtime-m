import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { DomainEvent, DomainEventPayloads } from '../../../common/events';
import {
  GOOGLE_DRIVE_PORT,
  IGoogleDrivePort,
} from '../ports/drive.port';
import {
  IMatchContextPort,
  MATCH_CONTEXT_PORT,
} from '../ports/match-context.port';

export interface CreateMatchPhotoFolderInput {
  matchId: string;
  /** ProfileId que dispara la creación (admin o sistema). */
  createdByProfileId: string;
  /** Carpeta padre opcional (por torneo/categoría). */
  parentFolderId?: string;
}

export interface CreateMatchPhotoFolderOutput {
  folderId: string;
  folderUrl: string;
  folderName: string;
}

/**
 * RN-051 — Crea la carpeta de Google Drive para las fotos del partido.
 *
 * Flujo:
 * 1. Carga contexto del match (home/away, categoría, torneo, fecha).
 * 2. Construye el nombre de carpeta (formato pendiente DP-015 — usamos un
 *    default razonable mientras tanto).
 * 3. Llama al port de Google Drive (en W3.2 es STUB; se cambia por la
 *    implementación real más adelante sin tocar este use-case).
 * 4. Crea un `MatchAnnouncement` con type='photo_folder_created' guardando
 *    el folderUrl como `message` (Match.metadata no existe en schema).
 * 5. Emite `match.photoFolder.created`.
 */
@Injectable()
export class CreateMatchPhotoFolderUseCase {
  private readonly logger = new Logger(CreateMatchPhotoFolderUseCase.name);

  constructor(
    @Inject(MATCH_CONTEXT_PORT)
    private readonly matchCtx: IMatchContextPort,
    @Inject(GOOGLE_DRIVE_PORT)
    private readonly drive: IGoogleDrivePort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: CreateMatchPhotoFolderInput,
  ): Promise<CreateMatchPhotoFolderOutput> {
    const ctx = await this.matchCtx.getMatchPhotoFolderContext(input.matchId);
    if (!ctx) {
      throw new BusinessError(
        ErrorCode.NOT_FOUND,
        `Partido ${input.matchId} no encontrado`,
        HttpStatus.NOT_FOUND,
        { matchId: input.matchId },
      );
    }

    // TODO: DP-015 — formato del nombre de carpeta.
    const folderName = buildDefaultFolderName(ctx);

    const { folderId, folderUrl } = await this.drive.createMatchFolder({
      matchId: input.matchId,
      name: folderName,
      parentFolderId: input.parentFolderId,
    });

    await this.matchCtx.createAnnouncement({
      matchId: input.matchId,
      type: 'photo_folder_created',
      title: 'Carpeta multimedia creada',
      message: folderUrl,
      createdByProfileId: input.createdByProfileId,
    });

    const payload: DomainEventPayloads['match.photoFolder.created'] = {
      matchId: input.matchId,
      folderId,
      folderUrl,
    };
    this.eventEmitter.emit(DomainEvent.MATCH_PHOTO_FOLDER_CREATED, payload);

    this.logger.log(
      `Carpeta Drive creada para match ${input.matchId} → ${folderUrl} (name=${folderName})`,
    );

    return { folderId, folderUrl, folderName };
  }
}

/**
 * Formato default mientras DP-015 no esté cerrada.
 *
 * Estructura: `{tournamentSlug}/{categorySlug}/{YYYY-MM-DD}/{home-vs-away}`.
 * Si faltan slugs, caemos a nombres y por último a IDs.
 */
function buildDefaultFolderName(
  ctx: NonNullable<Awaited<ReturnType<IMatchContextPort['getMatchPhotoFolderContext']>>>,
): string {
  const slugify = (v: string | null | undefined): string =>
    (v ?? '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const tournament = slugify(ctx.tournamentSlug ?? ctx.tournamentName) || 'tournament';
  const category = slugify(ctx.categorySlug ?? ctx.categoryName) || 'category';
  const date = ctx.matchDate.toISOString().slice(0, 10); // YYYY-MM-DD
  const home = slugify(ctx.homeTeamSlug ?? ctx.homeTeamName) || 'home';
  const away = slugify(ctx.awayTeamSlug ?? ctx.awayTeamName) || 'away';

  return `${tournament}/${category}/${date}/${home}-vs-${away}`;
}
