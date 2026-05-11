import { Injectable } from '@nestjs/common';
import type { CheckAvailabilityDto } from '@overtime-mono/shared';
import { VenuesService } from '../../venues.service';

@Injectable()
export class CheckVenueAvailabilityUseCase {
  constructor(private readonly legacy: VenuesService) {}

  async execute(id: string, checkAvailabilityDto: CheckAvailabilityDto) {
    return this.legacy.checkAvailability(id, checkAvailabilityDto);
  }
}
