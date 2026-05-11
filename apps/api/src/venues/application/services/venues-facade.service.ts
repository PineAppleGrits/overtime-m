import { Injectable } from '@nestjs/common';
import type {
  CheckAvailabilityDto,
  CreateVenueDto,
  PaginationDto,
  UpdateVenueDto,
} from '@overtime-mono/shared';
import { CheckVenueAvailabilityUseCase } from '../use-cases/check-venue-availability.use-case';
import { CreateVenueUseCase } from '../use-cases/create-venue.use-case';
import { FindAvailableVenuesUseCase } from '../use-cases/find-available-venues.use-case';
import { GetVenueUseCase } from '../use-cases/get-venue.use-case';
import { ListVenuesUseCase } from '../use-cases/list-venues.use-case';
import { RemoveVenueUseCase } from '../use-cases/remove-venue.use-case';
import { UpdateVenueUseCase } from '../use-cases/update-venue.use-case';

@Injectable()
export class VenuesFacadeService {
  constructor(
    private readonly createVenue: CreateVenueUseCase,
    private readonly listVenues: ListVenuesUseCase,
    private readonly findAvailableVenuesUseCase: FindAvailableVenuesUseCase,
    private readonly getVenue: GetVenueUseCase,
    private readonly checkAvailabilityUseCase: CheckVenueAvailabilityUseCase,
    private readonly updateVenue: UpdateVenueUseCase,
    private readonly removeVenue: RemoveVenueUseCase,
  ) {}

  async create(createVenueDto: CreateVenueDto) {
    return this.createVenue.execute(createVenueDto);
  }

  async findAll(paginationDto: PaginationDto, isActive?: boolean) {
    return this.listVenues.execute(paginationDto, isActive);
  }

  async findAvailableVenues(
    checkAvailabilityDto: CheckAvailabilityDto,
    paginationDto: PaginationDto,
  ) {
    return this.findAvailableVenuesUseCase.execute(
      checkAvailabilityDto,
      paginationDto,
    );
  }

  async findOne(id: string) {
    return this.getVenue.execute(id);
  }

  async checkAvailability(id: string, checkAvailabilityDto: CheckAvailabilityDto) {
    return this.checkAvailabilityUseCase.execute(id, checkAvailabilityDto);
  }

  async update(id: string, updateVenueDto: UpdateVenueDto) {
    return this.updateVenue.execute(id, updateVenueDto);
  }

  async remove(id: string) {
    return this.removeVenue.execute(id);
  }
}
