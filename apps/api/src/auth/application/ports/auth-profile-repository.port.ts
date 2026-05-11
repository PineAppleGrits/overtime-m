import type { Profile, ProfileRole } from '@prisma/client';
import type { AuthProfileEntity, PlayerProfileSummary } from '../../auth.types';

export const AUTH_PROFILE_REPOSITORY = Symbol('AUTH_PROFILE_REPOSITORY');

export interface IAuthProfileRepository {
  findBySupabaseUserId(supabaseUserId: string): Promise<AuthProfileEntity | null>;
  findProfileRecordBySupabaseUserId(
    supabaseUserId: string,
  ): Promise<
    Pick<
      Profile,
      | 'id'
      | 'name'
      | 'email'
      | 'role'
      | 'documentNumber'
      | 'documentVerified'
    > | null
  >;
  findById(profileId: string): Promise<AuthProfileEntity | null>;
  updatePlayerProfile(
    profileId: string,
    data: { role: ProfileRole; name?: string },
  ): Promise<PlayerProfileSummary | null>;
  updateDocumentNumberBySupabaseUserId(
    supabaseUserId: string,
    documentNumber: string,
  ): Promise<AuthProfileEntity>;
  updateDocumentNumberByProfileId(
    profileId: string,
    documentNumber: string,
  ): Promise<AuthProfileEntity>;
}
