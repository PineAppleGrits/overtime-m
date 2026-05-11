import { Injectable } from '@nestjs/common';
import type { UpdateVenueDto } from '@overtime-mono/shared';
import { VenuesService } from '../services/venues.service';

@Injectable()
export class UpdateVenueUseCase {
  constructor(private readonly venues: VenuesService) {}

  async execute(id: string, updateVenueDto: UpdateVenueDto) {
    return this.venues.update(id, updateVenueDto);
  }
}
