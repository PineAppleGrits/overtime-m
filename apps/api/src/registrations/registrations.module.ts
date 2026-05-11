import { Module } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { DatabaseModule } from '../database/database.module';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { AddRegistrationRosterEntryUseCase } from './application/use-cases/add-registration-roster-entry.use-case';
import { ApproveRegistrationUseCase } from './application/use-cases/approve-registration.use-case';
import { CreateRegistrationUseCase } from './application/use-cases/create-registration.use-case';
import { GetRegistrationUseCase } from './application/use-cases/get-registration.use-case';
import { GetRegistrationRosterUseCase } from './application/use-cases/get-registration-roster.use-case';
import { ListRegistrationsUseCase } from './application/use-cases/list-registrations.use-case';
import { RejectRegistrationUseCase } from './application/use-cases/reject-registration.use-case';
import { RemoveRegistrationUseCase } from './application/use-cases/remove-registration.use-case';
import { RegistrationsFacadeService } from './application/services/registrations-facade.service';

@Module({
  imports: [DatabaseModule, EligibilityModule],
  controllers: [RegistrationsController],
  providers: [
    RegistrationsService,
    RegistrationsFacadeService,
    CreateRegistrationUseCase,
    ListRegistrationsUseCase,
    GetRegistrationUseCase,
    GetRegistrationRosterUseCase,
    AddRegistrationRosterEntryUseCase,
    ApproveRegistrationUseCase,
    RejectRegistrationUseCase,
    RemoveRegistrationUseCase,
  ],
  exports: [RegistrationsService, RegistrationsFacadeService],
})
export class RegistrationsModule {}
