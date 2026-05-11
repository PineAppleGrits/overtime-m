import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  FRANCHISE_REPOSITORY,
  IFranchiseRepository,
} from '../ports/franchise-repository.port';

@Injectable()
export class GetFranchiseUseCase {
  constructor(
    @Inject(FRANCHISE_REPOSITORY)
    private readonly franchises: IFranchiseRepository,
  ) {}

  async execute(id: string) {
    const franchise = await this.franchises.findOne(id);
    if (!franchise) {
      throw new NotFoundException(`Franchise ${id} not found`);
    }

    return franchise;
  }
}
