import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { Sanction, SanctionProps } from '../../domain/entities/sanction.entity';
import { writeFechasState } from '../../domain/rules/fechas-counting.rules';
import {
  CreateSanctionInput,
  ISanctionRepository,
  ListSanctionsFilter,
  ListSanctionsResult,
} from '../../application/ports/sanction-repository.port';

type PrismaSanctionRow = Awaited<
  ReturnType<typeof PrismaService.prototype.sanction.findUnique>
>;

function rowToProps(row: NonNullable<PrismaSanctionRow>): SanctionProps {
  return {
    id: row.id,
    targetType: row.targetType,
    targetProfileId: row.targetProfileId,
    targetTeamId: row.targetTeamId,
    kind: row.kind,
    status: row.status,
    reason: row.reason,
    notes: row.notes,
    attachmentUrls: row.attachmentUrls,
    matchId: row.matchId,
    tournamentId: row.tournamentId,
    categoryId: row.categoryId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    amount: row.amount,
    currency: row.currency,
    createdByProfileId: row.createdByProfileId,
    resolvedByProfileId: row.resolvedByProfileId,
    resolvedAt: row.resolvedAt,
    resolutionNotes: row.resolutionNotes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class PrismaSanctionRepository implements ISanctionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSanctionInput): Promise<Sanction> {
    let notes = input.notes ?? null;
    if (input.totalFechas && input.totalFechas > 0) {
      notes = writeFechasState(notes, {
        totalFechas: input.totalFechas,
        fechasCumplidas: 0,
      });
    }
    const row = await this.prisma.sanction.create({
      data: {
        targetType: input.targetType,
        targetProfileId: input.targetProfileId,
        targetTeamId: input.targetTeamId,
        kind: input.kind,
        reason: input.reason,
        notes,
        attachmentUrls: input.attachmentUrls ?? [],
        matchId: input.matchId,
        tournamentId: input.tournamentId,
        categoryId: input.categoryId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        amount: input.amount,
        currency: input.currency ?? 'ARS',
        createdByProfileId: input.createdByProfileId,
      },
    });
    return new Sanction(rowToProps(row));
  }

  async findById(id: string): Promise<Sanction | null> {
    const row = await this.prisma.sanction.findUnique({ where: { id } });
    if (!row) return null;
    return new Sanction(rowToProps(row));
  }

  async list(filter: ListSanctionsFilter): Promise<ListSanctionsResult> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...rest
    } = filter;

    const where: Prisma.SanctionWhereInput = {};
    if (rest.status) where.status = rest.status;
    if (rest.kind) where.kind = rest.kind;
    if (rest.targetType) where.targetType = rest.targetType;
    if (rest.targetProfileId) where.targetProfileId = rest.targetProfileId;
    if (rest.targetTeamId) where.targetTeamId = rest.targetTeamId;
    if (rest.matchId) where.matchId = rest.matchId;
    if (rest.tournamentId) where.tournamentId = rest.tournamentId;
    if (rest.categoryId) where.categoryId = rest.categoryId;

    const [rows, total] = await Promise.all([
      this.prisma.sanction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.sanction.count({ where }),
    ]);

    return {
      data: rows.map((row) => new Sanction(rowToProps(row))),
      total,
      page,
      limit,
    };
  }

  async save(sanction: Sanction): Promise<Sanction> {
    const props = sanction.toProps();
    const row = await this.prisma.sanction.update({
      where: { id: props.id },
      data: {
        status: props.status,
        notes: props.notes,
        resolvedByProfileId: props.resolvedByProfileId,
        resolvedAt: props.resolvedAt,
        resolutionNotes: props.resolutionNotes,
        attachmentUrls: props.attachmentUrls,
      },
    });
    return new Sanction(rowToProps(row));
  }

  async findActiveForProfile(profileId: string): Promise<Sanction[]> {
    const rows = await this.prisma.sanction.findMany({
      where: { targetProfileId: profileId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => new Sanction(rowToProps(row)));
  }

  async findActiveForTeam(teamId: string): Promise<Sanction[]> {
    const rows = await this.prisma.sanction.findMany({
      where: { targetTeamId: teamId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => new Sanction(rowToProps(row)));
  }

  async addAttachmentUrl(sanctionId: string, url: string): Promise<Sanction> {
    const current = await this.prisma.sanction.findUnique({
      where: { id: sanctionId },
      select: { attachmentUrls: true },
    });
    if (!current) {
      throw new Error(`Sanción ${sanctionId} no encontrada`);
    }
    const row = await this.prisma.sanction.update({
      where: { id: sanctionId },
      data: { attachmentUrls: [...current.attachmentUrls, url] },
    });
    return new Sanction(rowToProps(row));
  }
}
