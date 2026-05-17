import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { PaymentsModule } from '../payments/payments.module';
import {
  REGISTRATION_ELIGIBILITY_PORT,
} from './application/ports/registration-eligibility.port';
import { REGISTRATION_EVENTS_PORT } from './application/ports/registration-events.port';
import {
  REGISTRATION_REPOSITORY,
} from './application/ports/registration-repository.port';
import {
  REGISTRATION_ROSTER_CONTEXT_PORT,
} from './application/ports/registration-roster-context.port';
import { RegistrationsService } from './application/services/registrations.service';
import { AddRegistrationRosterEntryUseCase } from './application/use-cases/add-registration-roster-entry.use-case';
import { ApproveRegistrationUseCase } from './application/use-cases/approve-registration.use-case';
import { CreateRegistrationUseCase } from './application/use-cases/create-registration.use-case';
import { GetRegistrationUseCase } from './application/use-cases/get-registration.use-case';
import { GetRegistrationRosterUseCase } from './application/use-cases/get-registration-roster.use-case';
import { ListRegistrationsUseCase } from './application/use-cases/list-registrations.use-case';
import { RejectRegistrationUseCase } from './application/use-cases/reject-registration.use-case';
import { RemoveRegistrationUseCase } from './application/use-cases/remove-registration.use-case';
import { RegistrationsController } from './presentation/controllers/registrations.controller';
import { RegistrationEligibilityAdapter } from './infrastructure/adapters/eligibility.adapter';
import { RegistrationEventsAdapter } from './infrastructure/adapters/events.adapter';
import { RegistrationRosterContextAdapter } from './infrastructure/adapters/roster-context.adapter';
import { PrismaRegistrationRepository } from './infrastructure/repositories/prisma-registration.repository';

@Module({
  imports: [DatabaseModule, EligibilityModule, PaymentsModule],
  controllers: [RegistrationsController],
  providers: [
    RegistrationsService,
    CreateRegistrationUseCase,
    ListRegistrationsUseCase,
    GetRegistrationUseCase,
    GetRegistrationRosterUseCase,
    AddRegistrationRosterEntryUseCase,
    ApproveRegistrationUseCase,
    RejectRegistrationUseCase,
    RemoveRegistrationUseCase,
    { provide: REGISTRATION_REPOSITORY, useClass: PrismaRegistrationRepository },
    {
      provide: REGISTRATION_ROSTER_CONTEXT_PORT,
      useClass: RegistrationRosterContextAdapter,
    },
    {
      provide: REGISTRATION_ELIGIBILITY_PORT,
      useClass: RegistrationEligibilityAdapter,
    },
    { provide: REGISTRATION_EVENTS_PORT, useClass: RegistrationEventsAdapter },
  ],
})
export class RegistrationsModule {}
