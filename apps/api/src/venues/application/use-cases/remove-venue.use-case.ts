import { Injectable } from '@nestjs/common';
import { VenuesService } from '../../venues.service';

@Injectable()
export class RemoveVenueUseCase {
  constructor(private readonly legacy: VenuesService) {}

  async execute(id: string) {
    return this.legacy.remove(id);
  }
}
