import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  CheckAvailabilityDto,
  CreateVenueDto,
  PaginationDto,
  UpdateVenueDto,
} from '@overtime-mono/shared';
import {
  IVenueRepository,
  VENUE_REPOSITORY,
} from '../ports/venue-repository.port';

@Injectable()
export class VenuesService {
  private readonly logger = new Logger(VenuesService.name);

  constructor(
    @Inject(VENUE_REPOSITORY)
    private readonly venues: IVenueRepository,
  ) {}

  async create(createVenueDto: CreateVenueDto) {
    const venue = await this.venues.create(createVenueDto);
    this.logger.log(`Venue created: ${(venue as { name: string }).name}`);
    return venue;
  }

  async findAll(paginationDto: PaginationDto, isActive?: boolean) {
    const { data, total } = await this.venues.findAll({
      pagination: paginationDto,
      filter: { isActive },
    });
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const venue = await this.venues.findById(id);
    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }
    return venue;
  }

  async update(id: string, updateVenueDto: UpdateVenueDto) {
    const current = (await this.findOne(id)) as { name: string };
    const venue = await this.venues.update(id, updateVenueDto);
    this.logger.log(`Venue updated: ${current.name}`);
    return venue;
  }

  async remove(id: string) {
    await this.findOne(id);
    const matchesCount = await this.venues.countActiveMatches(id);
    if (matchesCount > 0) {
      throw new BadRequestException(
        `Cannot delete venue with ${matchesCount} active match(es) assigned`,
      );
    }

    await this.venues.softDelete(id);
    this.logger.log(`Venue deleted: ${id}`);
    return { message: 'Venue deleted successfully' };
  }

  async checkAvailability(
    venueId: string,
    checkAvailabilityDto: CheckAvailabilityDto,
  ) {
    const venue = (await this.findOne(venueId)) as { isActive: boolean };
    if (!venue.isActive) {
      return {
        available: false,
        reason: 'Venue is not active',
      };
    }

    const conflictingMatches = await this.venues.findConflictingMatches(
      venueId,
      checkAvailabilityDto,
    );

    if (conflictingMatches.length > 0) {
      return {
        available: false,
        reason: 'Venue has conflicting matches',
        conflictingMatches: conflictingMatches.map((match) => ({
          id: match.id,
          matchDate: match.matchDate,
          homeTeam: match.homeTeamId,
          awayTeam: match.awayTeamId,
        })),
      };
    }

    return { available: true };
  }

  async findAvailableVenues(
    checkAvailabilityDto: CheckAvailabilityDto,
    paginationDto: PaginationDto,
  ) {
    const { data, total } = await this.venues.findAvailable({
      checkAvailability: checkAvailabilityDto,
      pagination: paginationDto,
    });
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
