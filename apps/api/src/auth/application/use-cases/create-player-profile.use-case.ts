import { Injectable } from '@nestjs/common';
import type { CreatePlayerProfileDto } from '@overtime-mono/shared';
import { AuthService } from '../../auth.service';

@Injectable()
export class CreatePlayerProfileUseCase {
  constructor(private readonly legacy: AuthService) {}

  async execute(supabaseUserId: string, dto: CreatePlayerProfileDto) {
    return this.legacy.createPlayerProfile(supabaseUserId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }
}
