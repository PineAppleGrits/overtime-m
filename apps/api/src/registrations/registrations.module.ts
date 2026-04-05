import { Module } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { DatabaseModule } from '../database/database.module';
import { EligibilityModule } from '../eligibility/eligibility.module';

@Module({
  imports: [DatabaseModule, EligibilityModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
