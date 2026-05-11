import { Module } from '@nestjs/common';
import { VenuesService } from './venues.service';
import { DatabaseModule } from '../database/database.module';
import { VENUE_REPOSITORY } from './application/ports/venue-repository.port';
import { VenuesService as ApplicationVenuesService } from './application/services/venues.service';
import { CheckVenueAvailabilityUseCase } from './application/use-cases/check-venue-availability.use-case';
import { CreateVenueUseCase } from './application/use-cases/create-venue.use-case';
import { FindAvailableVenuesUseCase } from './application/use-cases/find-available-venues.use-case';
import { GetVenueUseCase } from './application/use-cases/get-venue.use-case';
import { ListVenuesUseCase } from './application/use-cases/list-venues.use-case';
import { RemoveVenueUseCase } from './application/use-cases/remove-venue.use-case';
import { UpdateVenueUseCase } from './application/use-cases/update-venue.use-case';
import { PrismaVenueRepository } from './infrastructure/repositories/prisma-venue.repository';
import { VenuesController } from './presentation/controllers/venues.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [VenuesController],
  providers: [
    VenuesService,
    ApplicationVenuesService,
    CreateVenueUseCase,
    ListVenuesUseCase,
    FindAvailableVenuesUseCase,
    GetVenueUseCase,
    CheckVenueAvailabilityUseCase,
    UpdateVenueUseCase,
    RemoveVenueUseCase,
    { provide: VENUE_REPOSITORY, useClass: PrismaVenueRepository },
  ],
  exports: [VenuesService],
})
export class VenuesModule {}
