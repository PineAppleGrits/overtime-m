import { Injectable } from '@nestjs/common';
import type { PaginationSchemaDto } from '@overtime-mono/shared';
import { TeamsService } from '../services/teams.service';

@Injectable()
export class ListTeamsUseCase {
  constructor(private readonly teams: TeamsService) {}

  async execute(paginationDto: PaginationSchemaDto) {
    return this.teams.findAll(paginationDto);
  }
}
