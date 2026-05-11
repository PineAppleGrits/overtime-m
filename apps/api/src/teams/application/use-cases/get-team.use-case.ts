import { Injectable } from '@nestjs/common';
import { TeamsService } from '../../teams.service';

@Injectable()
export class GetTeamUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(id: string) {
    return this.legacy.findOne(id);
  }
}
