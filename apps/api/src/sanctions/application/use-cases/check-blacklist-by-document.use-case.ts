import { Inject, Injectable } from '@nestjs/common';
import { BlacklistEntry } from '@prisma/client';
import {
  BLACKLIST_REPOSITORY,
  IBlacklistRepository,
} from '../ports/blacklist-repository.port';

@Injectable()
export class CheckBlacklistByDocumentUseCase {
  constructor(
    @Inject(BLACKLIST_REPOSITORY)
    private readonly repo: IBlacklistRepository,
  ) {}

  async execute(
    documentNumber: string,
  ): Promise<{ blocked: boolean; entries: BlacklistEntry[] }> {
    const entries = await this.repo.findActive({ documentNumber });
    return { blocked: entries.length > 0, entries };
  }
}
