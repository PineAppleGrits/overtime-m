import { Injectable } from '@nestjs/common';
import { Prisma, Profile, ProfileRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  IProfileRepository,
  MergeProfilesInput,
  ProfileListFilter,
  ProfileListResult,
} from '../../application/ports/profile-repository.port';

@Injectable()
export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Profile | null> {
    return this.prisma.profile.findFirst({ where: { id, deletedAt: null } });
  }

  async findBySupabaseUserId(supabaseUserId: string): Promise<Profile | null> {
    return this.prisma.profile.findFirst({
      where: { supabaseUserId, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<Profile | null> {
    return this.prisma.profile.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findByDocumentNumber(documentNumber: string): Promise<Profile | null> {
    return this.prisma.profile.findFirst({
      where: { documentNumber, deletedAt: null },
    });
  }

  async findStubByDocumentNumber(
    documentNumber: string,
  ): Promise<Profile | null> {
    return this.prisma.profile.findFirst({
      where: {
        documentNumber,
        supabaseUserId: null,
        deletedAt: null,
      },
    });
  }

  async list(filter: ProfileListFilter): Promise<ProfileListResult> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;
    const sortBy = filter.sortBy ?? 'name';
    const sortOrder = filter.sortOrder ?? 'asc';
    const skip = (page - 1) * limit;

    const where: Prisma.ProfileWhereInput = { deletedAt: null };
    if (filter.roles?.length) {
      where.role = { in: filter.roles };
    }
    if (filter.search?.trim()) {
      const term = filter.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { documentNumber: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.profile.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async countActiveTeams(profileId: string): Promise<number> {
    return this.prisma.profileTeam.count({
      where: { profileId, isActive: true },
    });
  }

  async setDniPhoto(
    profileId: string,
    dniPhotoAssetId: string,
  ): Promise<Profile> {
    return this.prisma.profile.update({
      where: { id: profileId },
      data: {
        dniPhotoAssetId,
        // Re-verificar manualmente — limpio campos de verificación.
        documentVerified: false,
        documentVerifiedBy: null,
        documentVerifiedAt: null,
      },
    });
  }

  async markDocumentVerified(input: {
    profileId: string;
    documentNumber: string;
    verifiedBy: string;
  }): Promise<Profile> {
    return this.prisma.profile.update({
      where: { id: input.profileId },
      data: {
        documentNumber: input.documentNumber,
        documentVerified: true,
        documentVerifiedBy: input.verifiedBy,
        documentVerifiedAt: new Date(),
      },
    });
  }

  async updateRole(input: {
    profileId: string;
    newRole: ProfileRole;
  }): Promise<Profile> {
    return this.prisma.profile.update({
      where: { id: input.profileId },
      data: { role: input.newRole },
    });
  }

  async createPreCreatedAccount(input: {
    email: string;
    name: string;
    role: ProfileRole;
  }): Promise<Profile> {
    return this.prisma.profile.create({
      data: {
        email: input.email,
        name: input.name,
        role: input.role,
        // supabaseUserId se llena cuando el usuario se registre con ese email.
      },
    });
  }

  /**
   * RN-035 — fusiona el stub `mergedProfileId` en el `survivorProfileId`.
   *
   * Mueve relaciones simples (FK = profileId) en una transacción. Las
   * relaciones complejas con roles distintos se quedan, salvo `ProfileTeam`
   * que tiene unique (profileId, teamId): si el survivor ya tiene una row
   * con ese teamId, se conserva la del survivor y se borra la del stub
   * (la del survivor es más reciente; isActive ya está en true si está jugando).
   *
   * No se modifica el schema — usamos los nombres de tabla generados por
   * Prisma. Si una relación falla, se relanza para revertir la transacción.
   */
  async mergeProfiles(
    input: MergeProfilesInput,
  ): Promise<{ movedRelations: Record<string, number> }> {
    const { survivorProfileId, mergedProfileId } = input;
    if (survivorProfileId === mergedProfileId) {
      return { movedRelations: {} };
    }

    return this.prisma.$transaction(async (tx) => {
      const moved: Record<string, number> = {};

      // ProfileTeam: si el survivor ya tiene la misma teamId, borrar la del stub;
      // si no, reasignar.
      const stubMemberships = await tx.profileTeam.findMany({
        where: { profileId: mergedProfileId },
        select: { id: true, teamId: true },
      });
      let movedPT = 0;
      let droppedPT = 0;
      for (const m of stubMemberships) {
        const survivorHas = await tx.profileTeam.findUnique({
          where: {
            profileId_teamId: {
              profileId: survivorProfileId,
              teamId: m.teamId,
            },
          },
        });
        if (survivorHas) {
          await tx.profileTeam.delete({ where: { id: m.id } });
          droppedPT += 1;
        } else {
          await tx.profileTeam.update({
            where: { id: m.id },
            data: { profileId: survivorProfileId },
          });
          movedPT += 1;
        }
      }
      moved.profileTeam = movedPT;
      if (droppedPT > 0) moved.profileTeamDropped = droppedPT;

      // MatchRoster: schema lo tiene como profileId — mover.
      const matchRosterMoved = await tx.matchRoster.updateMany({
        where: { profileId: mergedProfileId },
        data: { profileId: survivorProfileId },
      });
      moved.matchRoster = matchRosterMoved.count;

      // RegistrationRosterEntry — relación "RegistrationRosterProfile"
      const regRosterMoved = await tx.registrationRosterEntry.updateMany({
        where: { profileId: mergedProfileId },
        data: { profileId: survivorProfileId },
      });
      moved.registrationRosterEntry = regRosterMoved.count;

      // Soft-delete del stub.
      await tx.profile.update({
        where: { id: mergedProfileId },
        data: { deletedAt: new Date() },
      });

      return { movedRelations: moved };
    });
  }

  async hasActiveBlacklist(documentNumber: string): Promise<boolean> {
    const count = await this.prisma.blacklistEntry.count({
      where: {
        documentNumber,
        status: 'ACTIVE',
      },
    });
    return count > 0;
  }
}
