import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Profile, Sanction } from '@prisma/client';
import {
  BlacklistQueryDto,
  CreateBlacklistEntryDto,
  CreateSanctionDto,
  EligibilityQueryDto,
  EligibilityResponseDto,
  LiftBlacklistEntryDto,
  ResolveSanctionDto,
  SanctionQueryDto,
  SanctionKindDto,
  SanctionTargetTypeDto,
} from '@overtime-mono/shared';
import { PrismaService } from '../database/prisma.service';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

type EligibilityScope = {
  tournamentId?: string;
  categoryId?: string;
  matchId?: string;
};

type EligibilityBlocker = {
  type: string;
  reason: string;
  sourceId: string;
};

type MatchScope = {
  id: string;
  categoryId: string | null;
  category: {
    tournamentId: string;
  } | null;
};

@Injectable()
export class EligibilityService {
  private readonly logger = new Logger(EligibilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  private normalizeDocumentNumber(documentNumber: string): string {
    return documentNumber.trim();
  }

  private async getProfileOrThrow(
    profileId: string,
    prisma: PrismaClientLike = this.prisma,
  ): Promise<Profile> {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId, deletedAt: null },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  private async getTeamOrThrow(
    teamId: string,
    prisma: PrismaClientLike = this.prisma,
  ): Promise<{ id: string; name: string }> {
    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  private async getMatchScopeOrThrow(
    matchId: string,
    prisma: PrismaClientLike = this.prisma,
  ): Promise<MatchScope> {
    const match = await prisma.match.findUnique({
      where: { id: matchId, deletedAt: null },
      select: {
        id: true,
        categoryId: true,
        category: {
          select: {
            tournamentId: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return match;
  }

  private async normalizeScope(
    scope?: EligibilityQueryDto,
    prisma: PrismaClientLike = this.prisma,
  ): Promise<EligibilityScope> {
    if (!scope) {
      return {};
    }

    let tournamentId = scope.tournamentId;
    let categoryId = scope.categoryId;
    const matchId = scope.matchId;

    if (matchId) {
      const match = await this.getMatchScopeOrThrow(matchId, prisma);
      categoryId ??= match.categoryId ?? undefined;
      tournamentId ??= match.category?.tournamentId;
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, deletedAt: null },
        select: {
          id: true,
          tournamentId: true,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (tournamentId && tournamentId !== category.tournamentId) {
        throw new BadRequestException(
          'Category does not belong to the specified tournament',
        );
      }

      tournamentId = category.tournamentId;
    }

    return {
      tournamentId,
      categoryId,
      matchId,
    };
  }

  private sanctionIsActiveNow(sanction: Sanction): boolean {
    if (sanction.status !== 'ACTIVE') {
      return false;
    }

    const now = new Date();

    if (sanction.startsAt && sanction.startsAt > now) {
      return false;
    }

    if (sanction.endsAt && sanction.endsAt < now) {
      return false;
    }

    return true;
  }

  private sanctionMatchesScope(
    sanction: Sanction,
    scope: EligibilityScope,
  ): boolean {
    if (!scope.tournamentId && !scope.categoryId && !scope.matchId) {
      return true;
    }

    if (sanction.matchId) {
      return sanction.matchId === scope.matchId;
    }

    if (sanction.categoryId) {
      return sanction.categoryId === scope.categoryId;
    }

    if (sanction.tournamentId) {
      return sanction.tournamentId === scope.tournamentId;
    }

    return true;
  }

  private getSanctionBlockers(
    sanctions: Sanction[],
    scope: EligibilityScope,
  ): EligibilityBlocker[] {
    return sanctions
      .filter((sanction) => this.sanctionIsActiveNow(sanction))
      .filter((sanction) => this.sanctionMatchesScope(sanction, scope))
      .map((sanction) => ({
        type: `SANCTION_${sanction.kind}`,
        reason: sanction.reason,
        sourceId: sanction.id,
      }));
  }

  private async findActiveBlacklists(params: {
    profileId?: string;
    documentNumber?: string | null;
  }, prisma: PrismaClientLike = this.prisma) {
    const whereConditions: Prisma.BlacklistEntryWhereInput[] = [];

    if (params.profileId) {
      whereConditions.push({ profileId: params.profileId });
    }

    if (params.documentNumber) {
      whereConditions.push({ documentNumber: params.documentNumber });
    }

    if (whereConditions.length === 0) {
      return [];
    }

    return prisma.blacklistEntry.findMany({
      where: {
        status: 'ACTIVE',
        OR: whereConditions,
      },
      orderBy: {
        blockedAt: 'desc',
      },
    });
  }

  private getBlacklistBlockers(
    blacklists: Array<{ id: string; reason: string }>,
  ): EligibilityBlocker[] {
    return blacklists.map((entry) => ({
      type: 'BLACKLIST',
      reason: entry.reason,
      sourceId: entry.id,
    }));
  }

  private buildBlockedMessage(kind: 'profile' | 'team', blockers: EligibilityBlocker[]): string {
    const reasons = blockers.map((blocker) => blocker.reason).join('; ');
    return `The ${kind} is not eligible to participate: ${reasons}`;
  }

  private async resolveBlacklistSubject(
    dto: CreateBlacklistEntryDto,
    prisma: PrismaClientLike = this.prisma,
  ): Promise<{
    profileId?: string;
    documentNumber: string;
    profileNameSnapshot: string;
  }> {
    if (dto.profileId) {
      const profile = await prisma.profile.findUnique({
        where: { id: dto.profileId, deletedAt: null },
        select: {
          id: true,
          documentNumber: true,
          name: true,
        },
      });

      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      if (!profile.documentNumber) {
        throw new BadRequestException(
          'Cannot blacklist a profile without document number',
        );
      }

      if (
        dto.documentNumber &&
        this.normalizeDocumentNumber(dto.documentNumber) !== profile.documentNumber
      ) {
        throw new BadRequestException(
          'Provided documentNumber does not match the profile document number',
        );
      }

      return {
        profileId: profile.id,
        documentNumber: profile.documentNumber,
        profileNameSnapshot: profile.name,
      };
    }

    if (!dto.documentNumber) {
      throw new BadRequestException(
        'documentNumber is required when profileId is not provided',
      );
    }

    if (!dto.profileNameSnapshot) {
      throw new BadRequestException(
        'profileNameSnapshot is required when profileId is not provided',
      );
    }

    const normalizedDocumentNumber = this.normalizeDocumentNumber(
      dto.documentNumber,
    );

    const existingProfile = await prisma.profile.findFirst({
      where: {
        documentNumber: normalizedDocumentNumber,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return {
      profileId: existingProfile?.id,
      documentNumber: normalizedDocumentNumber,
      profileNameSnapshot: existingProfile?.name ?? dto.profileNameSnapshot,
    };
  }

  private async assertRefereeCanCreateSanction(
    createdByProfileId: string,
    matchId: string | undefined,
  ): Promise<void> {
    if (!matchId) {
      throw new BadRequestException(
        'Referee sanctions must be linked to a match',
      );
    }

    const assignment = await this.prisma.matchStaff.findFirst({
      where: {
        matchId,
        role: 'referee',
        status: 'assigned',
        staff: {
          profileId: createdByProfileId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
      },
    });

    if (!assignment) {
      throw new ForbiddenException(
        'Only the assigned referee can create sanctions for this match',
      );
    }
  }

  private async resolveSanctionScope(
    dto: CreateSanctionDto,
    prisma: PrismaClientLike = this.prisma,
  ): Promise<EligibilityScope> {
    let tournamentId = dto.tournamentId;
    let categoryId = dto.categoryId;

    if (dto.matchId) {
      const match = await this.getMatchScopeOrThrow(dto.matchId, prisma);
      const matchTournamentId = match.category?.tournamentId;

      if (categoryId && categoryId !== match.categoryId) {
        throw new BadRequestException(
          'categoryId does not match the match category',
        );
      }

      if (
        tournamentId &&
        matchTournamentId &&
        tournamentId !== matchTournamentId
      ) {
        throw new BadRequestException(
          'tournamentId does not match the match tournament',
        );
      }

      categoryId = match.categoryId ?? undefined;
      tournamentId = matchTournamentId ?? tournamentId;
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, deletedAt: null },
        select: {
          id: true,
          tournamentId: true,
        },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      if (tournamentId && category.tournamentId !== tournamentId) {
        throw new BadRequestException(
          'categoryId does not belong to the specified tournament',
        );
      }

      tournamentId = category.tournamentId;
    }

    return {
      tournamentId,
      categoryId,
      matchId: dto.matchId,
    };
  }

  private async assertSanctionTargetExists(dto: CreateSanctionDto): Promise<void> {
    if (dto.targetType === SanctionTargetTypeDto.PROFILE) {
      if (!dto.targetProfileId) {
        throw new BadRequestException('targetProfileId is required');
      }

      await this.getProfileOrThrow(dto.targetProfileId);
      return;
    }

    if (!dto.targetTeamId) {
      throw new BadRequestException('targetTeamId is required');
    }

    await this.getTeamOrThrow(dto.targetTeamId);
  }

  async createBlacklistEntry(
    dto: CreateBlacklistEntryDto,
    blockedByProfileId: string,
  ) {
    const subject = await this.resolveBlacklistSubject(dto);

    const existingEntry = await this.prisma.blacklistEntry.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { documentNumber: subject.documentNumber },
          ...(subject.profileId ? [{ profileId: subject.profileId }] : []),
        ],
      },
      select: {
        id: true,
      },
    });

    if (existingEntry) {
      throw new ConflictException('There is already an active blacklist entry');
    }

    const createdEntry = await this.prisma.$transaction(async (tx) => {
      const entry = await tx.blacklistEntry.create({
        data: {
          profileId: subject.profileId,
          documentNumber: subject.documentNumber,
          profileNameSnapshot: subject.profileNameSnapshot,
          reason: dto.reason,
          attachmentUrls: dto.attachmentUrls ?? [],
          blockedByProfileId,
        },
        include: {
          profile: {
            select: {
              id: true,
              name: true,
              documentNumber: true,
            },
          },
          blockedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (subject.profileId) {
        await tx.profileTeam.updateMany({
          where: {
            profileId: subject.profileId,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });
      }

      return entry;
    });

    this.logger.log(`Blacklist created for document ${subject.documentNumber}`);

    return createdEntry;
  }

  async findAllBlacklists(query: BlacklistQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'blockedAt',
      sortOrder = 'desc',
      status,
      profileId,
      documentNumber,
      createdBy,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.BlacklistEntryWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (profileId) {
      where.profileId = profileId;
    }

    if (documentNumber) {
      where.documentNumber = this.normalizeDocumentNumber(documentNumber);
    }

    if (createdBy) {
      where.blockedByProfileId = createdBy;
    }

    const [data, total] = await Promise.all([
      this.prisma.blacklistEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          profile: {
            select: {
              id: true,
              name: true,
              documentNumber: true,
            },
          },
          blockedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          liftedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.blacklistEntry.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBlacklistById(id: string) {
    const entry = await this.prisma.blacklistEntry.findUnique({
      where: { id },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            documentNumber: true,
          },
        },
        blockedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        liftedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Blacklist entry not found');
    }

    return entry;
  }

  async liftBlacklistEntry(
    id: string,
    dto: LiftBlacklistEntryDto,
    liftedByProfileId: string,
  ) {
    const entry = await this.findBlacklistById(id);

    if (entry.status !== 'ACTIVE') {
      throw new BadRequestException('Blacklist entry is not active');
    }

    const updatedEntry = await this.prisma.blacklistEntry.update({
      where: { id },
      data: {
        status: 'LIFTED',
        liftedByProfileId,
        liftedAt: new Date(),
        resolutionNotes: dto.resolutionNotes,
      },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            documentNumber: true,
          },
        },
        blockedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        liftedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Blacklist lifted: ${id}`);

    return updatedEntry;
  }

  async createSanction(dto: CreateSanctionDto, createdByProfileId: string) {
    const creator = await this.getProfileOrThrow(createdByProfileId);

    await this.assertSanctionTargetExists(dto);

    if (dto.endsAt && dto.startsAt && new Date(dto.endsAt) < new Date(dto.startsAt)) {
      throw new BadRequestException('endsAt must be greater than startsAt');
    }

    if (creator.role === 'referee') {
      await this.assertRefereeCanCreateSanction(createdByProfileId, dto.matchId);
    }

    const scope = await this.resolveSanctionScope(dto);

    const sanction = await this.prisma.sanction.create({
      data: {
        targetType: dto.targetType,
        targetProfileId: dto.targetProfileId,
        targetTeamId: dto.targetTeamId,
        kind: dto.kind,
        reason: dto.reason,
        notes: dto.notes,
        attachmentUrls: dto.attachmentUrls ?? [],
        matchId: dto.matchId,
        tournamentId: scope.tournamentId,
        categoryId: scope.categoryId,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        amount: dto.amount,
        currency: dto.currency ?? 'ARS',
        createdByProfileId,
      },
      include: {
        targetProfile: {
          select: {
            id: true,
            name: true,
          },
        },
        targetTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        match: {
          select: {
            id: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Sanction created: ${sanction.id}`);

    return sanction;
  }

  async findAllSanctions(query: SanctionQueryDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      kind,
      targetType,
      targetProfileId,
      targetTeamId,
      matchId,
      tournamentId,
      categoryId,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.SanctionWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (kind) {
      where.kind = kind;
    }

    if (targetType) {
      where.targetType = targetType;
    }

    if (targetProfileId) {
      where.targetProfileId = targetProfileId;
    }

    if (targetTeamId) {
      where.targetTeamId = targetTeamId;
    }

    if (matchId) {
      where.matchId = matchId;
    }

    if (tournamentId) {
      where.tournamentId = tournamentId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [data, total] = await Promise.all([
      this.prisma.sanction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          targetProfile: {
            select: {
              id: true,
              name: true,
            },
          },
          targetTeam: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          match: {
            select: {
              id: true,
            },
          },
          tournament: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.sanction.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findSanctionById(id: string) {
    const sanction = await this.prisma.sanction.findUnique({
      where: { id },
      include: {
        targetProfile: {
          select: {
            id: true,
            name: true,
          },
        },
        targetTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        match: {
          select: {
            id: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!sanction) {
      throw new NotFoundException('Sanction not found');
    }

    return sanction;
  }

  async resolveSanction(
    id: string,
    dto: ResolveSanctionDto,
    resolvedByProfileId: string,
  ) {
    const sanction = await this.findSanctionById(id);

    if (sanction.status !== 'ACTIVE') {
      throw new BadRequestException('Sanction is not active');
    }

    const updatedSanction = await this.prisma.sanction.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedByProfileId,
        resolvedAt: new Date(),
        resolutionNotes: dto.resolutionNotes,
      },
      include: {
        targetProfile: {
          select: {
            id: true,
            name: true,
          },
        },
        targetTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        match: {
          select: {
            id: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Sanction resolved: ${id}`);

    return updatedSanction;
  }

  async getProfileEligibility(
    profileId: string,
    scope?: EligibilityQueryDto,
  ): Promise<EligibilityResponseDto> {
    const profile = await this.getProfileOrThrow(profileId);
    const normalizedScope = await this.normalizeScope(scope);

    const [blacklists, sanctions] = await Promise.all([
      this.findActiveBlacklists({
        profileId: profile.id,
        documentNumber: profile.documentNumber,
      }),
      this.prisma.sanction.findMany({
        where: {
          targetProfileId: profile.id,
          status: 'ACTIVE',
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const blockers = [
      ...this.getBlacklistBlockers(blacklists),
      ...this.getSanctionBlockers(sanctions, normalizedScope),
    ];

    return {
      eligible: blockers.length === 0,
      blockers,
    };
  }

  async getTeamEligibility(
    teamId: string,
    scope?: EligibilityQueryDto,
  ): Promise<EligibilityResponseDto> {
    await this.getTeamOrThrow(teamId);
    const normalizedScope = await this.normalizeScope(scope);

    const sanctions = await this.prisma.sanction.findMany({
      where: {
        targetTeamId: teamId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const blockers = this.getSanctionBlockers(sanctions, normalizedScope);

    return {
      eligible: blockers.length === 0,
      blockers,
    };
  }

  async assertProfileNotBlacklisted(
    profileId: string,
    prisma: PrismaClientLike = this.prisma,
  ): Promise<void> {
    const profile = await this.getProfileOrThrow(profileId, prisma);
    const blacklists = await this.findActiveBlacklists({
      profileId,
      documentNumber: profile.documentNumber,
    }, prisma);

    if (blacklists.length > 0) {
      throw new ConflictException(
        this.buildBlockedMessage(
          'profile',
          this.getBlacklistBlockers(blacklists),
        ),
      );
    }
  }

  async assertProfileEligibleForRegistration(params: {
    profileId: string;
    tournamentId?: string;
    categoryId?: string;
    matchId?: string;
  }, prisma: PrismaClientLike = this.prisma): Promise<void> {
    const profile = await this.getProfileOrThrow(params.profileId, prisma);
    const normalizedScope = await this.normalizeScope(
      {
        tournamentId: params.tournamentId,
        categoryId: params.categoryId,
        matchId: params.matchId,
      },
      prisma,
    );
    const [blacklists, sanctions] = await Promise.all([
      this.findActiveBlacklists(
        {
          profileId: profile.id,
          documentNumber: profile.documentNumber,
        },
        prisma,
      ),
      prisma.sanction.findMany({
        where: {
          targetProfileId: profile.id,
          status: 'ACTIVE',
        },
      }),
    ]);
    const blockers = [
      ...this.getBlacklistBlockers(blacklists),
      ...this.getSanctionBlockers(sanctions, normalizedScope),
    ];

    if (blockers.length > 0) {
      throw new ConflictException(
        this.buildBlockedMessage('profile', blockers),
      );
    }
  }

  async assertTeamEligibleForRegistration(params: {
    teamId: string;
    tournamentId?: string;
    categoryId?: string;
  }, prisma: PrismaClientLike = this.prisma): Promise<void> {
    await this.getTeamOrThrow(params.teamId, prisma);
    const normalizedScope = await this.normalizeScope(
      {
        tournamentId: params.tournamentId,
        categoryId: params.categoryId,
      },
      prisma,
    );
    const sanctions = await prisma.sanction.findMany({
      where: {
        targetTeamId: params.teamId,
        status: 'ACTIVE',
      },
    });
    const blockers = this.getSanctionBlockers(sanctions, normalizedScope);

    if (blockers.length > 0) {
      throw new ConflictException(
        this.buildBlockedMessage('team', blockers),
      );
    }
  }

  async assertTeamEligibleForMatch(params: {
    teamId: string;
    tournamentId?: string;
    categoryId?: string;
    matchId?: string;
  }, prisma: PrismaClientLike = this.prisma): Promise<void> {
    await this.getTeamOrThrow(params.teamId, prisma);
    const normalizedScope = await this.normalizeScope(
      {
        tournamentId: params.tournamentId,
        categoryId: params.categoryId,
        matchId: params.matchId,
      },
      prisma,
    );
    const sanctions = await prisma.sanction.findMany({
      where: {
        targetTeamId: params.teamId,
        status: 'ACTIVE',
      },
    });
    const blockers = this.getSanctionBlockers(sanctions, normalizedScope);

    if (blockers.length > 0) {
      throw new ConflictException(
        this.buildBlockedMessage('team', blockers),
      );
    }
  }
}
