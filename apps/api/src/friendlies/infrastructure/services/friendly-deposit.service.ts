import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateFriendlyDepositsInput,
  FriendlyDepositInfo,
  IFriendlyDepositService,
} from '../../application/ports/friendly-deposit-service.port';

/**
 * Implementación interna del IFriendlyDepositService usando Prisma directo.
 *
 * TODO: refactor cuando W2.1 (Debts module) esté mergeado — usar IDebtRepository
 * en su lugar para mantener una sola fuente de verdad sobre Debts.
 */
@Injectable()
export class FriendlyDepositService implements IFriendlyDepositService {
  private readonly logger = new Logger(FriendlyDepositService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createDeposits(input: CreateFriendlyDepositsInput): Promise<{
    home: FriendlyDepositInfo;
    away: FriendlyDepositInfo;
  }> {
    const amount = new Prisma.Decimal(input.depositAmount);
    const currency = input.currency ?? 'ARS';

    const [home, away] = await this.prisma.$transaction([
      this.prisma.debt.create({
        data: {
          type: 'FRIENDLY_DEPOSIT',
          status: 'APPROVED',
          concept: `Seña amistoso (equipo local) — ${input.friendlyId.slice(0, 8)}`,
          originAmount: amount,
          currentBalance: amount,
          currency,
          dueDate: input.dueDate,
          team: { connect: { id: input.homeTeamId } },
          friendly: { connect: { id: input.friendlyId } },
          createdBy: { connect: { id: input.createdByProfileId } },
        },
        select: { id: true, teamId: true, status: true },
      }),
      this.prisma.debt.create({
        data: {
          type: 'FRIENDLY_DEPOSIT',
          status: 'APPROVED',
          concept: `Seña amistoso (equipo visitante) — ${input.friendlyId.slice(0, 8)}`,
          originAmount: amount,
          currentBalance: amount,
          currency,
          dueDate: input.dueDate,
          team: { connect: { id: input.awayTeamId } },
          friendly: { connect: { id: input.friendlyId } },
          createdBy: { connect: { id: input.createdByProfileId } },
        },
        select: { id: true, teamId: true, status: true },
      }),
    ]);

    return {
      home: { id: home.id, teamId: home.teamId!, status: home.status },
      away: { id: away.id, teamId: away.teamId!, status: away.status },
    };
  }

  async cancelDepositsForFriendly(
    friendlyId: string,
    reason: string,
  ): Promise<void> {
    // Marcar como CANCELLED las debts no pagadas. Las que ya están PAID
    // no se tocan (histórico).
    await this.prisma.debt.updateMany({
      where: {
        friendlyId,
        type: 'FRIENDLY_DEPOSIT',
        status: { in: ['APPROVED', 'PARTIALLY_PAID'] },
        deletedAt: null,
      },
      data: {
        status: 'CANCELLED',
        notes: reason,
      },
    });
  }

  async findDepositById(debtId: string): Promise<{
    id: string;
    friendlyId: string | null;
    teamId: string | null;
    status: string;
    type: string;
  } | null> {
    return this.prisma.debt.findFirst({
      where: { id: debtId, deletedAt: null },
      select: {
        id: true,
        friendlyId: true,
        teamId: true,
        status: true,
        type: true,
      },
    });
  }

  async listByFriendly(friendlyId: string): Promise<FriendlyDepositInfo[]> {
    const debts = await this.prisma.debt.findMany({
      where: {
        friendlyId,
        type: 'FRIENDLY_DEPOSIT',
        deletedAt: null,
      },
      select: { id: true, teamId: true, status: true },
    });
    return debts.map((d) => ({
      id: d.id,
      teamId: d.teamId ?? '',
      status: d.status,
    }));
  }
}
