import { Injectable } from '@nestjs/common';
import type { PaginationDto } from '@overtime-mono/shared';
import { RegistrationsService } from '../../registrations.service';

@Injectable()
export class ListRegistrationsUseCase {
  constructor(private readonly legacy: RegistrationsService) {}

  async execute(
    paginationDto: PaginationDto,
    filters: {
      tournamentId?: string;
      teamId?: string;
      categoryId?: string;
      status?: string;
    },
  ) {
    return this.legacy.findAll(paginationDto, filters);
  }
}
