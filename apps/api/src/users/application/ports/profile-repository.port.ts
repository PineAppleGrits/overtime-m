import { Profile, ProfileRole } from '@prisma/client';

/**
 * Puerto de persistencia de perfiles. Aísla los use-cases de Prisma.
 * No expone tipos del ORM en su API pública (sólo las entidades del cliente).
 */
export interface ProfileListFilter {
  search?: string;
  roles?: ProfileRole[];
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProfileListResult {
  data: Profile[];
  total: number;
  page: number;
  limit: number;
}

export interface MergeProfilesInput {
  /** Profile de la cuenta nueva (la que sobrevive). */
  survivorProfileId: string;
  /** Profile registro previo (sin supabaseUserId) que se va a soft-delete. */
  mergedProfileId: string;
}

export interface IProfileRepository {
  findById(id: string): Promise<Profile | null>;
  findBySupabaseUserId(supabaseUserId: string): Promise<Profile | null>;
  findByEmail(email: string): Promise<Profile | null>;
  findByDocumentNumber(documentNumber: string): Promise<Profile | null>;
  /** Buscar registros previos sin cuenta (`supabaseUserId=null`) por DNI. RN-035. */
  findStubByDocumentNumber(documentNumber: string): Promise<Profile | null>;
  list(filter: ProfileListFilter): Promise<ProfileListResult>;
  countActiveTeams(profileId: string): Promise<number>;

  /**
   * Setea la foto de DNI (asetId) y desverifica el documento hasta que un
   * admin lo confirme. Idempotente.
   */
  setDniPhoto(profileId: string, dniPhotoAssetId: string): Promise<Profile>;

  /**
   * Marca el documento como verificado por un admin. Setea documentNumber.
   */
  markDocumentVerified(input: {
    profileId: string;
    documentNumber: string;
    verifiedBy: string;
  }): Promise<Profile>;

  updateRole(input: {
    profileId: string;
    newRole: ProfileRole;
  }): Promise<Profile>;

  createPreCreatedAccount(input: {
    email: string;
    name: string;
    role: ProfileRole;
  }): Promise<Profile>;

  /**
   * RN-035 — fusiona dos profiles: mueve relaciones de mergedProfileId al
   * survivorProfileId y soft-deletea el viejo. Idempotente — si el merged
   * ya está borrado, no falla.
   */
  mergeProfiles(input: MergeProfilesInput): Promise<{
    movedRelations: Record<string, number>;
  }>;

  hasActiveBlacklist(documentNumber: string): Promise<boolean>;
}

export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');
