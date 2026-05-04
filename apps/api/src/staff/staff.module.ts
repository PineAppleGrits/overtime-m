import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DebtsModule } from '../debts/debts.module';

// Application — service (facade)
import { StaffService } from './application/services/staff.service';

// Application — use cases
import { CreateStaffUseCase } from './application/use-cases/create-staff.use-case';
import { UpdateStaffUseCase } from './application/use-cases/update-staff.use-case';
import { DeleteStaffUseCase } from './application/use-cases/delete-staff.use-case';
import { GetStaffUseCase } from './application/use-cases/get-staff.use-case';
import { SetAvailabilityUseCase } from './application/use-cases/set-availability.use-case';
import { FindAvailableStaffUseCase } from './application/use-cases/find-available-staff.use-case';
import { AssignToMatchUseCase } from './application/use-cases/assign-to-match.use-case';
import { BatchAssignToMatchesUseCase } from './application/use-cases/batch-assign-to-matches.use-case';
import { RemoveFromMatchUseCase } from './application/use-cases/remove-from-match.use-case';
import { GetAssignedMatchesUseCase } from './application/use-cases/get-assigned-matches.use-case';
import { ValidateMinStaffUseCase } from './application/use-cases/validate-min-staff.use-case';
import { ComputeAjcFeeUseCase } from './application/use-cases/compute-ajc-fee.use-case';
import { ApplyAjcUseCase } from './application/use-cases/apply-ajc.use-case';
import { CreateMatchPhotoFolderUseCase } from './application/use-cases/create-match-photo-folder.use-case';

// Application — port symbols
import { STAFF_REPOSITORY } from './application/ports/staff-repository.port';
import { STAFF_AVAILABILITY_REPOSITORY } from './application/ports/staff-availability-repository.port';
import { MATCH_STAFF_REPOSITORY } from './application/ports/match-staff-repository.port';
import { GOOGLE_DRIVE_PORT } from './application/ports/drive.port';
import { DEBTS_PORT } from './application/ports/debts.port';
import { SANCTIONS_PORT } from './application/ports/sanctions.port';
import { MATCH_CONTEXT_PORT } from './application/ports/match-context.port';

// Infrastructure
import { PrismaStaffRepository } from './infrastructure/repositories/prisma-staff.repository';
import { PrismaStaffAvailabilityRepository } from './infrastructure/repositories/prisma-staff-availability.repository';
import { PrismaMatchStaffRepository } from './infrastructure/repositories/prisma-match-staff.repository';
import { GoogleDriveAdapter } from './infrastructure/adapters/google-drive.adapter';
import { DebtsAdapter } from './infrastructure/adapters/debts.adapter';
import { SanctionsAdapter } from './infrastructure/adapters/sanctions.adapter';
import { MatchContextAdapter } from './infrastructure/adapters/match-context.adapter';
import { MatchStartedListener } from './infrastructure/listeners/match-started.listener';

// Presentation
import { StaffController } from './presentation/controllers/staff.controller';

/**
 * W3.2 — Módulo de Staff (clean architecture).
 *
 * Cubre RN-049, RN-050, RN-051, RN-030.
 *
 * Importa `DebtsModule` para que `DebtsAdapter` pueda resolver `DebtsService`
 * (W2.1) y crear las Debts AJC.
 */
@Module({
  imports: [DatabaseModule, DebtsModule],
  controllers: [StaffController],
  providers: [
    // Facade
    StaffService,

    // Use cases
    CreateStaffUseCase,
    UpdateStaffUseCase,
    DeleteStaffUseCase,
    GetStaffUseCase,
    SetAvailabilityUseCase,
    FindAvailableStaffUseCase,
    AssignToMatchUseCase,
    BatchAssignToMatchesUseCase,
    RemoveFromMatchUseCase,
    GetAssignedMatchesUseCase,
    ValidateMinStaffUseCase,
    ComputeAjcFeeUseCase,
    ApplyAjcUseCase,
    CreateMatchPhotoFolderUseCase,

    // Ports → infra bindings
    { provide: STAFF_REPOSITORY, useClass: PrismaStaffRepository },
    {
      provide: STAFF_AVAILABILITY_REPOSITORY,
      useClass: PrismaStaffAvailabilityRepository,
    },
    { provide: MATCH_STAFF_REPOSITORY, useClass: PrismaMatchStaffRepository },
    { provide: GOOGLE_DRIVE_PORT, useClass: GoogleDriveAdapter },
    { provide: DEBTS_PORT, useClass: DebtsAdapter },
    { provide: SANCTIONS_PORT, useClass: SanctionsAdapter },
    { provide: MATCH_CONTEXT_PORT, useClass: MatchContextAdapter },

    // Listeners
    MatchStartedListener,
  ],
  exports: [StaffService],
})
export class StaffModule {}
