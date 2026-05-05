import { Injectable } from '@nestjs/common';
import { ProfileRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  DebtSummary,
  FriendlySummary,
  INotificationContextPort,
  MatchSummary,
  PaymentSummary,
  ProfileContact,
  RegistrationSummary,
  SanctionSummary,
  TeamWithCaptain,
} from '../../application/ports/notification-context.port';

@Injectable()
export class PrismaNotificationContextRepository
  implements INotificationContextPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findRegistration(id: string): Promise<RegistrationSummary | null> {
    const r = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        team: { include: { captain: true } },
        tournament: true,
        category: true,
        requester: true,
      },
    });
    if (!r) return null;
    return {
      id: r.id,
      team: mapTeamWithCaptain(r.team),
      tournamentName: r.tournament.name,
      categoryName: r.category?.name ?? null,
      rejectionReason: r.rejectionReason ?? null,
      requester: mapProfileContact(r.requester),
    };
  }

  async findMatch(id: string): Promise<MatchSummary | null> {
    const m = await this.prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: { include: { captain: true } },
        awayTeam: { include: { captain: true } },
      },
    });
    if (!m) return null;
    return {
      id: m.id,
      homeTeam: mapTeamWithCaptain(m.homeTeam),
      awayTeam: mapTeamWithCaptain(m.awayTeam),
    };
  }

  async findFriendly(id: string): Promise<FriendlySummary | null> {
    const f = await this.prisma.friendly.findUnique({
      where: { id },
      include: {
        homeTeam: { include: { captain: true } },
        awayTeam: { include: { captain: true } },
        venue: true,
      },
    });
    if (!f) return null;
    return {
      id: f.id,
      homeTeam: mapTeamWithCaptain(f.homeTeam),
      awayTeam: mapTeamWithCaptain(f.awayTeam),
      matchDate: f.proposedDate ?? null,
      venueName: f.venue?.name ?? null,
      depositDeadline: f.confirmationDeadline ?? null,
    };
  }

  async findDebt(id: string): Promise<DebtSummary | null> {
    const d = await this.prisma.debt.findUnique({
      where: { id },
      include: {
        team: { include: { captain: true } },
        profile: true,
      },
    });
    if (!d) return null;
    return {
      id: d.id,
      type: d.type,
      amount: Number(d.currentBalance),
      currency: d.currency,
      dueDate: d.dueDate,
      team: mapTeamWithCaptain(d.team),
      profile: mapProfileContact(d.profile),
      conceptLabel: d.concept,
    };
  }

  async findPayment(id: string): Promise<PaymentSummary | null> {
    const p = await this.prisma.payment.findUnique({
      where: { id },
      include: { profile: true, debt: true },
    });
    if (!p) return null;
    return {
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      conceptLabel: p.debt?.concept ?? 'Pago Overtime',
      paidByProfile: mapProfileContact(p.profile),
    };
  }

  async findSanction(id: string): Promise<SanctionSummary | null> {
    const s = await this.prisma.sanction.findUnique({
      where: { id },
      include: {
        targetProfile: true,
        targetTeam: { include: { captain: true } },
      },
    });
    if (!s) return null;
    return {
      id: s.id,
      type: s.kind,
      description: s.reason,
      fechasAffected: null,
      targetProfile: mapProfileContact(s.targetProfile),
      targetTeam: mapTeamWithCaptain(s.targetTeam),
    };
  }

  async findProfile(id: string): Promise<ProfileContact | null> {
    const p = await this.prisma.profile.findFirst({
      where: { id, deletedAt: null },
    });
    return mapProfileContact(p);
  }

  async findAdminsWithEmail(): Promise<ProfileContact[]> {
    const admins = await this.prisma.profile.findMany({
      where: {
        deletedAt: null,
        role: { in: [ProfileRole.admin, ProfileRole.master] },
        email: { not: null },
      },
      select: { id: true, email: true, name: true },
    });
    return admins.map((a) => ({
      id: a.id,
      email: a.email ?? null,
      name: a.name,
    }));
  }
}

function mapTeamWithCaptain(
  team: { id: string; name: string; captain?: { id: string; email: string | null; name: string } | null } | null,
): TeamWithCaptain | null {
  if (!team) return null;
  return {
    id: team.id,
    name: team.name,
    captain: team.captain
      ? {
          id: team.captain.id,
          email: team.captain.email ?? null,
          name: team.captain.name,
        }
      : null,
  };
}

function mapProfileContact(
  profile: { id: string; email: string | null; name: string } | null,
): ProfileContact | null {
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email ?? null,
    name: profile.name,
  };
}
