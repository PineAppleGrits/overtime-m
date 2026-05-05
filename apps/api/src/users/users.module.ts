import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

// Legacy
import { UsersController } from './users.controller';
import { UsersService as LegacyUsersService } from './users.service';

// Application — services + use cases (clean architecture W3.4)
import { UsersService } from './application/services/users.service';
import { AssignRoleUseCase } from './application/use-cases/assign-role.use-case';
import { ComputeActiveStatusUseCase } from './application/use-cases/compute-active-status.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { PreCreateAccountUseCase } from './application/use-cases/pre-create-account.use-case';
import { UploadDniPhotoUseCase } from './application/use-cases/upload-dni-photo.use-case';
import { VerifyDniUseCase } from './application/use-cases/verify-dni.use-case';

// Application — port symbols
import { DNI_VERIFICATION_PORT } from './application/ports/dni-verification.port';
import { PROFILE_REPOSITORY } from './application/ports/profile-repository.port';

// Infrastructure
import { DniVerificationStubAdapter } from './infrastructure/adapters/dni-verification-stub.adapter';
import { PrismaProfileRepository } from './infrastructure/repositories/prisma-profile.repository';

// Presentation
import { ProfileController } from './presentation/controllers/profile.controller';
import { UsersAdminController } from './presentation/controllers/users-admin.controller';

/**
 * W3.4 — Módulo Users.
 *
 * Convive el controller legacy (`UsersController` con CRUD basic admin) con
 * la nueva clean architecture (DNI flow, role assignment, pre-create,
 * active status, profile self-service).
 *
 * Cuando se haga la migración total del CRUD a clean, se borra el legacy.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [
    UsersController,
    UsersAdminController,
    ProfileController,
  ],
  providers: [
    // Legacy
    LegacyUsersService,

    // Application
    UsersService,
    AssignRoleUseCase,
    ComputeActiveStatusUseCase,
    GetUserUseCase,
    ListUsersUseCase,
    PreCreateAccountUseCase,
    UploadDniPhotoUseCase,
    VerifyDniUseCase,

    // Port bindings
    { provide: PROFILE_REPOSITORY, useClass: PrismaProfileRepository },
    { provide: DNI_VERIFICATION_PORT, useClass: DniVerificationStubAdapter },
  ],
  exports: [
    LegacyUsersService,
    UsersService,
    PROFILE_REPOSITORY,
  ],
})
export class UsersModule {}
