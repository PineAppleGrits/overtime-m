import { Inject, Injectable } from '@nestjs/common';
import { Sanction } from '../../domain/entities/sanction.entity';
import {
  CreateSanctionUseCase,
  CreateSanctionUseCaseInput,
} from '../use-cases/create-sanction.use-case';
import {
  ResolveSanctionUseCase,
  ResolveSanctionInput,
} from '../use-cases/resolve-sanction.use-case';
import {
  CancelSanctionUseCase,
  CancelSanctionInput,
} from '../use-cases/cancel-sanction.use-case';
import { ListSanctionsUseCase } from '../use-cases/list-sanctions.use-case';
import { GetSanctionUseCase } from '../use-cases/get-sanction.use-case';
import {
  CreateBlacklistEntryUseCase,
  CreateBlacklistEntryInput,
} from '../use-cases/create-blacklist-entry.use-case';
import {
  LiftBlacklistEntryUseCase,
  LiftBlacklistEntryInput,
} from '../use-cases/lift-blacklist-entry.use-case';
import { ListBlacklistUseCase } from '../use-cases/list-blacklist.use-case';
import { CheckBlacklistByDocumentUseCase } from '../use-cases/check-blacklist-by-document.use-case';
import {
  UploadBlacklistAttachmentInput,
  UploadBlacklistAttachmentUseCase,
} from '../use-cases/upload-blacklist-attachment.use-case';
import {
  ISanctionRepository,
  ListSanctionsFilter,
  ListSanctionsResult,
  SANCTION_REPOSITORY,
} from '../ports/sanction-repository.port';
import { ListBlacklistFilter, ListBlacklistResult } from '../ports/blacklist-repository.port';

/**
 * Facade del módulo Sanctions. Orquesta los use-cases y expone al resto del
 * sistema (eligibility, staff, etc.) un punto único de entrada.
 */
@Injectable()
export class SanctionsService {
  constructor(
    private readonly createSanctionUC: CreateSanctionUseCase,
    private readonly resolveSanctionUC: ResolveSanctionUseCase,
    private readonly cancelSanctionUC: CancelSanctionUseCase,
    private readonly listSanctionsUC: ListSanctionsUseCase,
    private readonly getSanctionUC: GetSanctionUseCase,
    private readonly createBlacklistUC: CreateBlacklistEntryUseCase,
    private readonly liftBlacklistUC: LiftBlacklistEntryUseCase,
    private readonly listBlacklistUC: ListBlacklistUseCase,
    private readonly checkBlacklistUC: CheckBlacklistByDocumentUseCase,
    private readonly uploadBlacklistAttachmentUC: UploadBlacklistAttachmentUseCase,
    @Inject(SANCTION_REPOSITORY)
    private readonly sanctionRepo: ISanctionRepository,
  ) {}

  // Sanctions
  createSanction(input: CreateSanctionUseCaseInput): Promise<Sanction> {
    return this.createSanctionUC.execute(input);
  }
  resolveSanction(input: ResolveSanctionInput): Promise<Sanction> {
    return this.resolveSanctionUC.execute(input);
  }
  cancelSanction(input: CancelSanctionInput): Promise<Sanction> {
    return this.cancelSanctionUC.execute(input);
  }
  listSanctions(filter: ListSanctionsFilter): Promise<ListSanctionsResult> {
    return this.listSanctionsUC.execute(filter);
  }
  getSanction(id: string): Promise<Sanction> {
    return this.getSanctionUC.execute(id);
  }

  // Blacklist
  createBlacklistEntry(input: CreateBlacklistEntryInput) {
    return this.createBlacklistUC.execute(input);
  }
  liftBlacklistEntry(input: LiftBlacklistEntryInput) {
    return this.liftBlacklistUC.execute(input);
  }
  listBlacklist(filter: ListBlacklistFilter): Promise<ListBlacklistResult> {
    return this.listBlacklistUC.execute(filter);
  }
  checkBlacklistByDocument(documentNumber: string) {
    return this.checkBlacklistUC.execute(documentNumber);
  }
  uploadBlacklistAttachment(input: UploadBlacklistAttachmentInput) {
    return this.uploadBlacklistAttachmentUC.execute(input);
  }

  // Helpers para que eligibility lea sanciones activas (port impl).
  async findActiveSanctionsForProfile(profileId: string): Promise<Sanction[]> {
    return this.sanctionRepo.findActiveForProfile(profileId);
  }
  async findActiveSanctionsForTeam(teamId: string): Promise<Sanction[]> {
    return this.sanctionRepo.findActiveForTeam(teamId);
  }
}
