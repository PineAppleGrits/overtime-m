import { Injectable } from '@nestjs/common';
import type { UpdateVenueDto } from '@overtime-mono/shared';
import { VenuesService } from '../../venues.service';

@Injectable()
export class UpdateVenueUseCase {
  constructor(private readonly legacy: VenuesService) {}

  async execute(id: string, updateVenueDto: UpdateVenueDto) {
    return this.legacy.update(id, updateVenueDto);
  }
}
