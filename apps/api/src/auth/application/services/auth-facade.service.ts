import { Injectable } from '@nestjs/common';
import type { CreatePlayerProfileDto } from '@overtime-mono/shared';
import { AdminUpdateDocumentNumberUseCase } from '../use-cases/admin-update-document-number.use-case';
import { CreatePlayerProfileUseCase } from '../use-cases/create-player-profile.use-case';
import { GetProfileUseCase } from '../use-cases/get-profile.use-case';
import { SetDocumentNumberUseCase } from '../use-cases/set-document-number.use-case';

@Injectable()
export class AuthFacadeService {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly setDocumentNumberUseCase: SetDocumentNumberUseCase,
    private readonly adminUpdateDocumentNumberUseCase: AdminUpdateDocumentNumberUseCase,
    private readonly createPlayerProfileUseCase: CreatePlayerProfileUseCase,
  ) {}

  async getProfile(supabaseUserId: string) {
    return this.getProfileUseCase.execute(supabaseUserId);
  }

  async setDocumentNumber(supabaseUserId: string, documentNumber: string) {
    return this.setDocumentNumberUseCase.execute(supabaseUserId, documentNumber);
  }

  async adminUpdateDocumentNumber(profileId: string, documentNumber: string) {
    return this.adminUpdateDocumentNumberUseCase.execute(
      profileId,
      documentNumber,
    );
  }

  async createPlayerProfile(
    supabaseUserId: string,
    dto: CreatePlayerProfileDto,
  ) {
    return this.createPlayerProfileUseCase.execute(supabaseUserId, dto);
  }
}
