import { Injectable } from '@nestjs/common';
import type { CreatePlayerProfileDto } from '@overtime-mono/shared';
import { AuthService } from '../services/auth.service';

@Injectable()
export class CreatePlayerProfileUseCase {
  constructor(private readonly auth: AuthService) {}

  async execute(supabaseUserId: string, dto: CreatePlayerProfileDto) {
    return this.auth.createPlayerProfile(supabaseUserId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }
}
