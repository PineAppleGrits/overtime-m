import { Injectable } from '@nestjs/common';
import type { CheckAvailabilityDto, PaginationDto } from '@overtime-mono/shared';
import { VenuesService } from '../../venues.service';

@Injectable()
export class FindAvailableVenuesUseCase {
  constructor(private readonly legacy: VenuesService) {}

  async execute(
    checkAvailabilityDto: CheckAvailabilityDto,
    paginationDto: PaginationDto,
  ) {
    return this.legacy.findAvailableVenues(checkAvailabilityDto, paginationDto);
  }
}
