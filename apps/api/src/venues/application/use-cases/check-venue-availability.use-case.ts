import { Injectable } from '@nestjs/common';
import type { CheckAvailabilityDto } from '@overtime-mono/shared';
import { VenuesService } from '../services/venues.service';

@Injectable()
export class CheckVenueAvailabilityUseCase {
  constructor(private readonly venues: VenuesService) {}

  async execute(id: string, checkAvailabilityDto: CheckAvailabilityDto) {
    return this.venues.checkAvailability(id, checkAvailabilityDto);
  }
}
