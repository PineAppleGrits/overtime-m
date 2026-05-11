import { Injectable } from '@nestjs/common';
import { TeamsService } from '../../teams.service';

@Injectable()
export class RemoveTeamUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(id: string) {
    return this.legacy.remove(id);
  }
}
