import { Injectable } from '@nestjs/common';
import { CompleteRegularPhaseUseCase } from '../use-cases/complete-regular-phase.use-case';
import { GetStandingsUseCase } from '../use-cases/get-standings.use-case';

@Injectable()
export class FixturesFacadeService {
  constructor(
    private readonly getStandingsUseCase: GetStandingsUseCase,
    private readonly completeRegularPhaseUseCase: CompleteRegularPhaseUseCase,
  ) {}

  async getStandings(categoryId: string) {
    return this.getStandingsUseCase.execute(categoryId);
  }

  async completeRegularPhase(categoryId: string) {
    return this.completeRegularPhaseUseCase.execute(categoryId);
  }
}
