import { Inject, Injectable } from '@nestjs/common';
import {
  ISanctionRepository,
  ListSanctionsFilter,
  ListSanctionsResult,
  SANCTION_REPOSITORY,
} from '../ports/sanction-repository.port';

@Injectable()
export class ListSanctionsUseCase {
  constructor(
    @Inject(SANCTION_REPOSITORY)
    private readonly repo: ISanctionRepository,
  ) {}

  async execute(filter: ListSanctionsFilter): Promise<ListSanctionsResult> {
    return this.repo.list(filter);
  }
}
