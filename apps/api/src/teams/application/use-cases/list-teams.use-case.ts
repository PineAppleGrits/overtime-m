import { Injectable } from '@nestjs/common';
import type { PaginationSchemaDto } from '@overtime-mono/shared';
import { TeamsService } from '../../teams.service';

@Injectable()
export class ListTeamsUseCase {
  constructor(private readonly legacy: TeamsService) {}

  async execute(paginationDto: PaginationSchemaDto) {
    return this.legacy.findAll(paginationDto);
  }
}
