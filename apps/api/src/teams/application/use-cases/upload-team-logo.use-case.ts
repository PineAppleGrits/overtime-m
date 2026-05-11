import { Injectable } from '@nestjs/common';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class UploadTeamLogoUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(
    teamId: string,
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    return this.teams.uploadLogo(teamId, userId, file);
  }
}
