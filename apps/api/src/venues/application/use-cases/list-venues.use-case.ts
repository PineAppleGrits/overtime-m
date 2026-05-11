import { Injectable } from '@nestjs/common';
import type { PaginationDto } from '@overtime-mono/shared';
import { VenuesService } from '../services/venues.service';

@Injectable()
export class ListVenuesUseCase {
  constructor(private readonly venues: VenuesService) {}

  async execute(paginationDto: PaginationDto, isActive?: boolean) {
    return this.venues.findAll(paginationDto, isActive);
  }
}
