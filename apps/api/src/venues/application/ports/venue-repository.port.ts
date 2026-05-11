import type { Prisma, Venue } from '@prisma/client';
import type {
  CheckAvailabilityDto,
  CreateVenueDto,
  PaginationDto,
  UpdateVenueDto,
} from '@overtime-mono/shared';

export const VENUE_REPOSITORY = Symbol('VENUE_REPOSITORY');

export interface VenueFindAllFilter {
  isActive?: boolean;
}

export interface IVenueRepository {
  create(data: CreateVenueDto): Promise<unknown>;
  findAll(params: {
    pagination: PaginationDto;
    filter: VenueFindAllFilter;
  }): Promise<{ data: unknown[]; total: number }>;
  findById(id: string): Promise<unknown | null>;
  update(id: string, data: UpdateVenueDto): Promise<unknown>;
  softDelete(id: string): Promise<void>;
  countActiveMatches(id: string): Promise<number>;
  findAvailable(params: {
    checkAvailability: CheckAvailabilityDto;
    pagination: PaginationDto;
  }): Promise<{ data: unknown[]; total: number }>;
  findConflictingMatches(
    venueId: string,
    checkAvailabilityDto: CheckAvailabilityDto,
  ): Promise<
    Array<{
      id: string;
      matchDate: Date;
      homeTeamId: string | null;
      awayTeamId: string | null;
    }>
  >;
}
