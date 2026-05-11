import { Injectable } from '@nestjs/common';
import type { ProfileRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import type {
  IAuthProfileRepository,
} from '../../application/ports/auth-profile-repository.port';

@Injectable()
export class PrismaAuthProfileRepository implements IAuthProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySupabaseUserId(supabaseUserId: string) {
    return this.prisma.profile.findUnique({
      where: { supabaseUserId },
      select: {
        id: true,
        supabaseUserId: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        phoneVerified: true,
        documentNumber: true,
        documentVerified: true,
        dateOfBirth: true,
        medicalCertificateUrl: true,
        swornStatementUrl: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findProfileRecordBySupabaseUserId(supabaseUserId: string) {
    return this.prisma.profile.findUnique({
      where: { supabaseUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        documentNumber: true,
        documentVerified: true,
      },
    });
  }

  async findById(profileId: string) {
    return this.prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        supabaseUserId: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        phoneVerified: true,
        documentNumber: true,
        documentVerified: true,
        dateOfBirth: true,
        medicalCertificateUrl: true,
        swornStatementUrl: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updatePlayerProfile(
    profileId: string,
    data: { role: ProfileRole; name?: string },
  ) {
    return this.prisma.profile.update({
      where: { id: profileId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
    });
  }

  async updateDocumentNumberBySupabaseUserId(
    supabaseUserId: string,
    documentNumber: string,
  ) {
    return this.prisma.profile.update({
      where: { supabaseUserId },
      data: { documentNumber },
      select: {
        id: true,
        supabaseUserId: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        phoneVerified: true,
        documentNumber: true,
        documentVerified: true,
        dateOfBirth: true,
        medicalCertificateUrl: true,
        swornStatementUrl: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateDocumentNumberByProfileId(profileId: string, documentNumber: string) {
    return this.prisma.profile.update({
      where: { id: profileId },
      data: { documentNumber },
      select: {
        id: true,
        supabaseUserId: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        phoneVerified: true,
        documentNumber: true,
        documentVerified: true,
        dateOfBirth: true,
        medicalCertificateUrl: true,
        swornStatementUrl: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
