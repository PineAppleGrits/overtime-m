import { Injectable } from '@nestjs/common';
import { FixturesService } from '../../fixtures.service';

@Injectable()
export class CompleteRegularPhaseUseCase {
  constructor(private readonly legacy: FixturesService) {}

  async execute(categoryId: string) {
    return this.legacy.completeRegularPhase(categoryId);
  }
}
