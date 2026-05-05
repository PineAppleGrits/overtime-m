import { Profile } from '@prisma/client';

export interface ProfileResponseDto {
  id: string;
  supabaseUserId: string | null;
  email: string | null;
  name: string;
  phone: string | null;
  documentNumber: string | null;
  documentVerified: boolean;
  documentVerifiedBy: string | null;
  documentVerifiedAt: string | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
  medicalCertificateUrl: string | null;
  swornStatementUrl: string | null;
  avatarAssetId: string | null;
  currentMedicalAssetId: string | null;
  currentSwornAssetId: string | null;
  dniPhotoAssetId: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export function toProfileResponseDto(profile: Profile): ProfileResponseDto {
  return {
    id: profile.id,
    supabaseUserId: profile.supabaseUserId ?? null,
    email: profile.email ?? null,
    name: profile.name,
    phone: profile.phone ?? null,
    documentNumber: profile.documentNumber ?? null,
    documentVerified: profile.documentVerified,
    documentVerifiedBy: profile.documentVerifiedBy ?? null,
    documentVerifiedAt: profile.documentVerifiedAt
      ? profile.documentVerifiedAt.toISOString()
      : null,
    dateOfBirth: profile.dateOfBirth
      ? profile.dateOfBirth.toISOString()
      : null,
    avatarUrl: profile.avatarUrl ?? null,
    medicalCertificateUrl: profile.medicalCertificateUrl ?? null,
    swornStatementUrl: profile.swornStatementUrl ?? null,
    avatarAssetId: profile.avatarAssetId ?? null,
    currentMedicalAssetId: profile.currentMedicalAssetId ?? null,
    currentSwornAssetId: profile.currentSwornAssetId ?? null,
    dniPhotoAssetId: profile.dniPhotoAssetId ?? null,
    role: profile.role,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
