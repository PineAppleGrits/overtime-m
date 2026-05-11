import { Injectable } from '@nestjs/common';
import type {
  CheckAvailabilityDto,
  CreateVenueDto,
  PaginationDto,
  UpdateVenueDto,
} from '@overtime-mono/shared';
import { VenuesService as ApplicationVenuesService } from './application/services/venues.service';

@Injectable()
export class VenuesService {
  constructor(private readonly service: ApplicationVenuesService) {}

  async create(createVenueDto: CreateVenueDto) {
    return this.service.create(createVenueDto);
  }

  async findAll(paginationDto: PaginationDto, isActive?: boolean) {
    return this.service.findAll(paginationDto, isActive);
  }

  async findOne(id: string) {
    return this.service.findOne(id);
  }

  async update(id: string, updateVenueDto: UpdateVenueDto) {
    return this.service.update(id, updateVenueDto);
  }

  async remove(id: string) {
    return this.service.remove(id);
  }

  async checkAvailability(
    venueId: string,
    checkAvailabilityDto: CheckAvailabilityDto,
  ) {
    return this.service.checkAvailability(venueId, checkAvailabilityDto);
  }

  async findAvailableVenues(
    checkAvailabilityDto: CheckAvailabilityDto,
    paginationDto: PaginationDto,
  ) {
    return this.service.findAvailableVenues(checkAvailabilityDto, paginationDto);
  }
}
