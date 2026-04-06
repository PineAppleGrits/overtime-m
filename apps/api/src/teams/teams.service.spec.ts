import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EligibilityService } from '../eligibility/eligibility.service';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  const makeUuid = (index: number): string =>
    `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;

  const createPrismaMock = () =>
    ({
      tournament: {
        findUnique: jest.fn(),
      },
      profile: {
        findUnique: jest.fn(),
      },
      team: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      franchise: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    }) as unknown as PrismaService;

  const createEligibilityMock = () =>
    ({
      assertProfileNotBlacklisted: jest.fn(),
    }) as unknown as EligibilityService;

  it('rejects tournament-scoped team creation before the operational window opens', async () => {
    const prisma = createPrismaMock();
    prisma.tournament.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(1),
      name: 'Clausura 2026',
      sportId: makeUuid(2),
      teamOperationsOpenAt: new Date('2099-01-01T00:00:00.000Z'),
      teamOperationsCloseAt: null,
    });

    const service = new TeamsService(prisma, createEligibilityMock());

    await expect(
      service.createForTournament(
        makeUuid(1),
        {
          name: 'Team Overtime',
          sportId: makeUuid(2),
        },
        makeUuid(999),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects promoting a team when the current user is not the creator', async () => {
    const prisma = createPrismaMock();
    prisma.team.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(10),
      name: 'Team Overtime',
      logoUrl: null,
      creatorId: makeUuid(111),
      franchiseId: null,
    });
    prisma.franchise.findFirst = jest.fn().mockResolvedValue(null);

    const service = new TeamsService(prisma, createEligibilityMock());

    await expect(
      service.promoteToFranchise(
        makeUuid(10),
        {
          name: 'Franquicia Overtime',
        },
        makeUuid(222),
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects adding a blacklisted player to a team', async () => {
    const prisma = createPrismaMock();
    const eligibility = createEligibilityMock();
    prisma.team.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(1),
      name: 'Team Overtime',
      sport: {},
      creator: null,
      captain: null,
      members: [],
      teamZones: [],
      registrations: [],
    });
    prisma.profile.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(2),
      name: 'Jugador Bloqueado',
    });
    (eligibility.assertProfileNotBlacklisted as jest.Mock).mockRejectedValue(
      new ConflictException('blocked'),
    );

    const service = new TeamsService(prisma, eligibility);

    await expect(
      service.addPlayer(makeUuid(1), {
        profileId: makeUuid(2),
      }),
    ).rejects.toThrow(ConflictException);
  });
});
