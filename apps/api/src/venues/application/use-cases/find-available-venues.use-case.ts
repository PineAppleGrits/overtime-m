import { Injectable } from '@nestjs/common';
import type { CheckAvailabilityDto, PaginationDto } from '@overtime-mono/shared';
import { VenuesService } from '../services/venues.service';

@Injectable()
export class FindAvailableVenuesUseCase {
  constructor(private readonly venues: VenuesService) {}

  async execute(
    checkAvailabilityDto: CheckAvailabilityDto,
    paginationDto: PaginationDto,
  ) {
    return this.venues.findAvailableVenues(checkAvailabilityDto, paginationDto);
  }
}
