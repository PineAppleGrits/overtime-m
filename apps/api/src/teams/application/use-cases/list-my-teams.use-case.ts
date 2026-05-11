import { Injectable } from '@nestjs/common';
import { TeamsService } from '../../teams.service';

@Injectable()
export class ListMyTeamsUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(profileId: string) {
    return this.legacy.findMine(profileId);
  }
}
