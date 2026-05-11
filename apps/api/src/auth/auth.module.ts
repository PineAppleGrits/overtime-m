import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AUTH_PROFILE_REPOSITORY } from './application/ports/auth-profile-repository.port';
import { IDENTITY_PROVIDER } from './application/ports/identity-provider.port';
import { AuthService as ApplicationAuthService } from './application/services/auth.service';
import { AdminUpdateDocumentNumberUseCase } from './application/use-cases/admin-update-document-number.use-case';
import { CreatePlayerProfileUseCase } from './application/use-cases/create-player-profile.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { SetDocumentNumberUseCase } from './application/use-cases/set-document-number.use-case';
import { SupabaseIdentityAdapter } from './infrastructure/adapters/supabase-identity.adapter';
import { PrismaAuthProfileRepository } from './infrastructure/repositories/prisma-auth-profile.repository';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    ApplicationAuthService,
    GetProfileUseCase,
    SetDocumentNumberUseCase,
    AdminUpdateDocumentNumberUseCase,
    CreatePlayerProfileUseCase,
    { provide: AUTH_PROFILE_REPOSITORY, useClass: PrismaAuthProfileRepository },
    { provide: IDENTITY_PROVIDER, useClass: SupabaseIdentityAdapter },
  ],
  exports: [AuthService],
})
export class AuthModule {}
