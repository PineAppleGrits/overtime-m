import { Injectable } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import type {
  AuthProfileResponse,
  PlayerProfileSummary,
} from './auth.types';
import { AuthService as ApplicationAuthService } from './application/services/auth.service';

@Injectable()
export class AuthService {
  constructor(private readonly service: ApplicationAuthService) {}

  async validateSupabaseToken(token: string): Promise<User> {
    return this.service.validateSupabaseToken(token);
  }

  async createPlayerProfile(
    supabaseUserId: string,
    playerData: { firstName: string; lastName: string },
  ): Promise<PlayerProfileSummary | null> {
    return this.service.createPlayerProfile(supabaseUserId, playerData);
  }

  async getProfile(supabaseUserId: string): Promise<AuthProfileResponse> {
    return this.service.getProfile(supabaseUserId);
  }

  async setDocumentNumber(
    supabaseUserId: string,
    documentNumber: string,
  ): Promise<AuthProfileResponse> {
    return this.service.setDocumentNumber(supabaseUserId, documentNumber);
  }

  async adminUpdateDocumentNumber(
    profileId: string,
    documentNumber: string,
  ): Promise<AuthProfileResponse> {
    return this.service.adminUpdateDocumentNumber(profileId, documentNumber);
  }

  async hasRole(supabaseUserId: string, roleName: string): Promise<boolean> {
    return this.service.hasRole(supabaseUserId, roleName);
  }
}
