import { Injectable } from '@nestjs/common';
import { FixturesService as ApplicationFixturesService } from './application/services/fixtures.service';

@Injectable()
export class FixturesService {
  constructor(private readonly service: ApplicationFixturesService) {}

  async getStandings(categoryId: string) {
    return this.service.getStandings(categoryId);
  }

  async completeRegularPhase(categoryId: string) {
    return this.service.completeRegularPhase(categoryId);
  }
}
