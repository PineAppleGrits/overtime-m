import { Injectable } from '@nestjs/common';
import type { PaginationDto } from '@overtime-mono/shared';
import { RegistrationsService } from '../services/registrations.service';

@Injectable()
export class ListRegistrationsUseCase {
  constructor(private readonly registrations: RegistrationsService) {}

  async execute(
    paginationDto: PaginationDto,
    filters: {
      tournamentId?: string;
      teamId?: string;
      categoryId?: string;
      status?: string;
    },
  ) {
    return this.registrations.findAll(paginationDto, filters);
  }
}
