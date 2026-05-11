import { Injectable } from '@nestjs/common';
import { VenuesService } from '../services/venues.service';

@Injectable()
export class RemoveVenueUseCase {
  constructor(private readonly venues: VenuesService) {}

  async execute(id: string) {
    return this.venues.remove(id);
  }
}
