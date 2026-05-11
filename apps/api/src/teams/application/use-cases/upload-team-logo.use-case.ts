import { Injectable } from '@nestjs/common';
import { TeamsService } from '../../teams.service';

@Injectable()
export class UploadTeamLogoUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(
    teamId: string,
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    return this.legacy.uploadLogo(teamId, userId, file);
  }
}
