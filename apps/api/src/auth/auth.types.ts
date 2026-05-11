import type { Profile, ProfileRole } from '@prisma/client';

export interface PlayerProfileSummary {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: ProfileRole;
}

export interface AuthProfileResponse {
  id: string;
  supabaseUserId: string | null;
  email: string | null;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  phoneVerified: boolean;
  documentNumber: string | null;
  documentVerified: boolean;
  dateOfBirth: Date | null;
  medicalCertificateUrl: string | null;
  swornStatementUrl: string | null;
  role: ProfileRole;
  hasPlayerProfile: boolean;
  profileId: string;
  createdAt: Date;
}

export type AuthProfileEntity = Pick<
  Profile,
  | 'id'
  | 'supabaseUserId'
  | 'email'
  | 'name'
  | 'avatarUrl'
  | 'phone'
  | 'phoneVerified'
  | 'documentNumber'
  | 'documentVerified'
  | 'dateOfBirth'
  | 'medicalCertificateUrl'
  | 'swornStatementUrl'
  | 'role'
  | 'createdAt'
>;

export interface CurrentAuthUser {
  id: string;
  profileId: string;
  supabaseUserId: string;
  role: ProfileRole;
}
