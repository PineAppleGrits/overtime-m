import { Injectable } from '@nestjs/common';
import type { CreateVenueDto } from '@overtime-mono/shared';
import { VenuesService } from '../services/venues.service';

@Injectable()
export class CreateVenueUseCase {
  constructor(private readonly venues: VenuesService) {}

  async execute(createVenueDto: CreateVenueDto) {
    return this.venues.create(createVenueDto);
  }
}
