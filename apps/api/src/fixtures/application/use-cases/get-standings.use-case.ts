import { Injectable } from '@nestjs/common';
import { FixturesService } from '../services/fixtures.service';

@Injectable()
export class GetStandingsUseCase {
  constructor(private readonly fixtures: FixturesService) {}

  async execute(categoryId: string) {
    return this.fixtures.getStandings(categoryId);
  }
}
