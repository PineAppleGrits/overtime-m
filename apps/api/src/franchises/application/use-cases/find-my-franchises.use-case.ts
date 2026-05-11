import { Inject, Injectable } from '@nestjs/common';
import {
  FRANCHISE_REPOSITORY,
  IFranchiseRepository,
} from '../ports/franchise-repository.port';

@Injectable()
export class FindMyFranchisesUseCase {
  constructor(
    @Inject(FRANCHISE_REPOSITORY)
    private readonly franchises: IFranchiseRepository,
  ) {}

  async execute(ownerId: string) {
    return this.franchises.findMine(ownerId);
  }
}
