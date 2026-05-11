import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminUpdateDocumentNumberUseCase } from './application/use-cases/admin-update-document-number.use-case';
import { CreatePlayerProfileUseCase } from './application/use-cases/create-player-profile.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { SetDocumentNumberUseCase } from './application/use-cases/set-document-number.use-case';
import { AuthFacadeService } from './application/services/auth-facade.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthFacadeService,
    GetProfileUseCase,
    SetDocumentNumberUseCase,
    AdminUpdateDocumentNumberUseCase,
    CreatePlayerProfileUseCase,
  ],
  exports: [AuthService, AuthFacadeService],
})
export class AuthModule {}
