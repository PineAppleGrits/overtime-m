import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

// Application — services (facade)
import { SanctionsService } from './application/services/sanctions.service';

// Application — use cases
import { CreateSanctionUseCase } from './application/use-cases/create-sanction.use-case';
import { ResolveSanctionUseCase } from './application/use-cases/resolve-sanction.use-case';
import { CancelSanctionUseCase } from './application/use-cases/cancel-sanction.use-case';
import { ListSanctionsUseCase } from './application/use-cases/list-sanctions.use-case';
import { GetSanctionUseCase } from './application/use-cases/get-sanction.use-case';
import { UploadSanctionAttachmentUseCase } from './application/use-cases/upload-sanction-attachment.use-case';
import { AddFechaCumplidaUseCase } from './application/use-cases/add-fecha-cumplida.use-case';
import { ApplyAjcToSanctionUseCase } from './application/use-cases/apply-ajc-to-sanction.use-case';
import { CreateBlacklistEntryUseCase } from './application/use-cases/create-blacklist-entry.use-case';
import { LiftBlacklistEntryUseCase } from './application/use-cases/lift-blacklist-entry.use-case';
import { ListBlacklistUseCase } from './application/use-cases/list-blacklist.use-case';
import { CheckBlacklistByDocumentUseCase } from './application/use-cases/check-blacklist-by-document.use-case';
import { UploadBlacklistAttachmentUseCase } from './application/use-cases/upload-blacklist-attachment.use-case';

// Application — ports
import { SANCTION_REPOSITORY } from './application/ports/sanction-repository.port';
import { BLACKLIST_REPOSITORY } from './application/ports/blacklist-repository.port';

// Infrastructure
import { PrismaSanctionRepository } from './infrastructure/repositories/prisma-sanction.repository';
import { PrismaBlacklistRepository } from './infrastructure/repositories/prisma-blacklist.repository';
import { MatchFinishedListener } from './infrastructure/listeners/match-finished.listener';
import { AjcAppliedListener } from './infrastructure/listeners/ajc-applied.listener';

// Presentation
import { SanctionsController } from './presentation/controllers/sanctions.controller';
import { BlacklistController } from './presentation/controllers/blacklist.controller';

/**
 * W3.3 — Sanctions module.
 *
 * Cubre:
 * - CRUD de sanciones (DISCIPLINARY / MONETARY) con conteo de fechas (RN-003).
 * - Blacklist (CRUD + lift + check público).
 * - Listeners: match.finished (incrementa fechas cumplidas) y sanction.ajc.applied
 *   (anota AJC + libera fechas, RN-030).
 * - Adjuntos de sanción via MediaAsset (PR0).
 *
 * Exporta `SanctionsService` para que `EligibilityModule` lo consuma como port
 * (lectura de sanciones activas).
 */
@Module({
  imports: [DatabaseModule],
  controllers: [SanctionsController, BlacklistController],
  providers: [
    // Facade
    SanctionsService,

    // Use-cases
    CreateSanctionUseCase,
    ResolveSanctionUseCase,
    CancelSanctionUseCase,
    ListSanctionsUseCase,
    GetSanctionUseCase,
    UploadSanctionAttachmentUseCase,
    AddFechaCumplidaUseCase,
    ApplyAjcToSanctionUseCase,
    CreateBlacklistEntryUseCase,
    LiftBlacklistEntryUseCase,
    ListBlacklistUseCase,
    CheckBlacklistByDocumentUseCase,
    UploadBlacklistAttachmentUseCase,

    // Ports → infra
    { provide: SANCTION_REPOSITORY, useClass: PrismaSanctionRepository },
    { provide: BLACKLIST_REPOSITORY, useClass: PrismaBlacklistRepository },

    // Listeners
    MatchFinishedListener,
    AjcAppliedListener,
  ],
  exports: [SanctionsService],
})
export class SanctionsModule {}
