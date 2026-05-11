import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import {
  AUTH_PROFILE_REPOSITORY,
  IAuthProfileRepository,
} from '../ports/auth-profile-repository.port';
import {
  IDENTITY_PROVIDER,
  IIdentityProvider,
} from '../ports/identity-provider.port';
import type {
  AuthProfileEntity,
  AuthProfileResponse,
  PlayerProfileSummary,
} from '../../auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AUTH_PROFILE_REPOSITORY)
    private readonly profiles: IAuthProfileRepository,
    @Inject(IDENTITY_PROVIDER)
    private readonly identity: IIdentityProvider,
  ) {}

  async validateSupabaseToken(token: string): Promise<User> {
    return this.identity.validateToken(token);
  }

  async createPlayerProfile(
    supabaseUserId: string,
    playerData: { firstName: string; lastName: string },
  ): Promise<PlayerProfileSummary | null> {
    const profile =
      await this.profiles.findProfileRecordBySupabaseUserId(supabaseUserId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.role === 'player') {
      throw new Error('Player profile already exists');
    }

    const name =
      profile.name?.trim() ||
      `${playerData.firstName ?? ''} ${playerData.lastName ?? ''}`.trim() ||
      profile.email ||
      'User';

    const updated = await this.profiles.updatePlayerProfile(profile.id, {
      role: 'player',
      ...(name !== profile.name ? { name } : {}),
    });

    this.logger.log(`Player profile created for user: ${supabaseUserId}`);
    return updated;
  }

  async getProfile(supabaseUserId: string): Promise<AuthProfileResponse> {
    const profile = await this.profiles.findBySupabaseUserId(supabaseUserId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.formatProfileResponse(profile);
  }

  async setDocumentNumber(
    supabaseUserId: string,
    documentNumber: string,
  ): Promise<AuthProfileResponse> {
    const profile =
      await this.profiles.findProfileRecordBySupabaseUserId(supabaseUserId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.documentNumber) {
      throw new ForbiddenException(
        'El número de documento ya fue establecido. Contactá a un administrador para modificarlo.',
      );
    }

    const updated = await this.profiles.updateDocumentNumberBySupabaseUserId(
      supabaseUserId,
      documentNumber,
    );
    this.logger.log(`Document number set for user: ${supabaseUserId}`);
    return this.formatProfileResponse(updated);
  }

  async adminUpdateDocumentNumber(
    profileId: string,
    documentNumber: string,
  ): Promise<AuthProfileResponse> {
    const profile = await this.profiles.findById(profileId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const updated = await this.profiles.updateDocumentNumberByProfileId(
      profileId,
      documentNumber,
    );

    this.logger.log(
      `Document number updated by admin for profile: ${profileId}`,
    );

    return this.formatProfileResponse(updated);
  }

  async hasRole(supabaseUserId: string, roleName: string): Promise<boolean> {
    const profile = await this.profiles.findBySupabaseUserId(supabaseUserId);
    if (!profile) {
      return false;
    }

    return profile.role === roleName;
  }

  private formatProfileResponse(profile: AuthProfileEntity): AuthProfileResponse {
    const hasPlayerProfile = profile.role === 'player';
    return {
      id: profile.id,
      supabaseUserId: profile.supabaseUserId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      phone: profile.phone,
      phoneVerified: profile.phoneVerified,
      documentNumber: profile.documentNumber,
      documentVerified: profile.documentVerified,
      dateOfBirth: profile.dateOfBirth,
      medicalCertificateUrl: profile.medicalCertificateUrl,
      swornStatementUrl: profile.swornStatementUrl,
      role: profile.role,
      hasPlayerProfile,
      profileId: profile.id,
      createdAt: profile.createdAt,
    };
  }
}
