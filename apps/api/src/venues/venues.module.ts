import { Module } from '@nestjs/common';
import { VenuesService } from './venues.service';
import { VenuesController } from './venues.controller';
import { DatabaseModule } from '../database/database.module';
import { CheckVenueAvailabilityUseCase } from './application/use-cases/check-venue-availability.use-case';
import { CreateVenueUseCase } from './application/use-cases/create-venue.use-case';
import { FindAvailableVenuesUseCase } from './application/use-cases/find-available-venues.use-case';
import { GetVenueUseCase } from './application/use-cases/get-venue.use-case';
import { ListVenuesUseCase } from './application/use-cases/list-venues.use-case';
import { RemoveVenueUseCase } from './application/use-cases/remove-venue.use-case';
import { UpdateVenueUseCase } from './application/use-cases/update-venue.use-case';
import { VenuesFacadeService } from './application/services/venues-facade.service';

@Module({
  imports: [DatabaseModule],
  controllers: [VenuesController],
  providers: [
    VenuesService,
    VenuesFacadeService,
    CreateVenueUseCase,
    ListVenuesUseCase,
    FindAvailableVenuesUseCase,
    GetVenueUseCase,
    CheckVenueAvailabilityUseCase,
    UpdateVenueUseCase,
    RemoveVenueUseCase,
  ],
  exports: [VenuesService, VenuesFacadeService],
})
export class VenuesModule {}
