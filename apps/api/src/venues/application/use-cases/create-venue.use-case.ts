import { Injectable } from '@nestjs/common';
import type { CreateVenueDto } from '@overtime-mono/shared';
import { VenuesService } from '../../venues.service';

@Injectable()
export class CreateVenueUseCase {
  constructor(private readonly legacy: VenuesService) {}

  async execute(createVenueDto: CreateVenueDto) {
    return this.legacy.create(createVenueDto);
  }
}
