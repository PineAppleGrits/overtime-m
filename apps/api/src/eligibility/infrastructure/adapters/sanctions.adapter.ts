import { Injectable } from '@nestjs/common';
import { SanctionsService } from '../../../sanctions/application/services/sanctions.service';
import { Sanction } from '../../../sanctions/domain/entities/sanction.entity';
import { PrismaService } from '../../../database/prisma.service';
import {
  BlacklistEntryLike,
  IEligibilitySanctionsPort,
} from '../../application/ports/sanctions-port.port';
import { SanctionLike } from '../../domain/rules/active-suspension.rules';

/**
 * Adapter del port `IEligibilitySanctionsPort`. Lee del módulo Sanctions y
 * de la tabla `blacklist_entries` (vía Prisma, ya que blacklists vive como
 * entidad sin entity de dominio en sanctions).
 */
@Injectable()
export class SanctionsEligibilityAdapter implements IEligibilitySanctionsPort {
  constructor(
    private readonly sanctionsService: SanctionsService,
    private readonly prisma: PrismaService,
  ) {}

  async findActiveSanctionsForProfile(
    profileId: string,
  ): Promise<SanctionLike[]> {
    const sanctions = await this.sanctionsService.findActiveSanctionsForProfile(
      profileId,
    );
    return sanctions.map(toSanctionLike);
  }

  async findActiveSanctionsForTeam(teamId: string): Promise<SanctionLike[]> {
    const sanctions = await this.sanctionsService.findActiveSanctionsForTeam(
      teamId,
    );
    return sanctions.map(toSanctionLike);
  }

  async findActiveBlacklistsFor(params: {
    profileId?: string;
    documentNumber?: string | null;
  }): Promise<BlacklistEntryLike[]> {
    const orConditions: Array<{ profileId?: string; documentNumber?: string }> = [];
    if (params.profileId) orConditions.push({ profileId: params.profileId });
    if (params.documentNumber) {
      orConditions.push({ documentNumber: params.documentNumber.trim() });
    }
    if (orConditions.length === 0) return [];

    const rows = await this.prisma.blacklistEntry.findMany({
      where: { status: 'ACTIVE', OR: orConditions },
      orderBy: { blockedAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      reason: row.reason,
      documentNumber: row.documentNumber,
      profileId: row.profileId,
    }));
  }
}

function toSanctionLike(sanction: Sanction): SanctionLike {
  const props = sanction.toProps();
  return {
    id: props.id,
    status: props.status,
    kind: props.kind,
    matchId: props.matchId,
    tournamentId: props.tournamentId,
    categoryId: props.categoryId,
    startsAt: props.startsAt,
    endsAt: props.endsAt,
  };
}
