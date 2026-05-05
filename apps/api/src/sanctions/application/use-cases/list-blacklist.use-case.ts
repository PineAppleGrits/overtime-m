import { Inject, Injectable } from '@nestjs/common';
import {
  BLACKLIST_REPOSITORY,
  IBlacklistRepository,
  ListBlacklistFilter,
  ListBlacklistResult,
} from '../ports/blacklist-repository.port';

@Injectable()
export class ListBlacklistUseCase {
  constructor(
    @Inject(BLACKLIST_REPOSITORY)
    private readonly repo: IBlacklistRepository,
  ) {}

  async execute(filter: ListBlacklistFilter): Promise<ListBlacklistResult> {
    return this.repo.list(filter);
  }
}
