import { BadRequestException } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { PrismaService } from '../database/prisma.service';
import { EligibilityService } from '../eligibility/eligibility.service';

describe('RegistrationsService', () => {
  const makeUuid = (index: number): string =>
    `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;

  const createPrismaMock = () =>
    ({
      team: {
        findUnique: jest.fn(),
      },
      tournament: {
        findUnique: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
      registration: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      profile: {
        findMany: jest.fn(),
      },
      profileTeam: {
        findMany: jest.fn(),
      },
      registrationRosterEntry: {
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
      },
      match: {
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    }) as unknown as PrismaService;

  const createEligibilityMock = () =>
    ({
      assertProfileEligibleForRegistration: jest.fn(),
      assertTeamEligibleForRegistration: jest.fn(),
    }) as unknown as EligibilityService;

  it('rejects creating a registration with fewer than 8 players', async () => {
    const prisma = createPrismaMock();
    const service = new RegistrationsService(prisma, createEligibilityMock());

    await expect(
      service.create(
        {
          teamId: makeUuid(100),
          tournamentId: makeUuid(200),
          categoryId: makeUuid(300),
          initialRoster: Array.from({ length: 7 }, (_, index) => ({
            documentNumber: `${40_000_000 + index}`,
            name: `Jugador ${index + 1}`,
          })),
        },
        makeUuid(999),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects roster additions when the registration status is not editable', async () => {
    const prisma = createPrismaMock();
    const eligibility = createEligibilityMock();
    prisma.registration.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(1),
      teamId: makeUuid(2),
      tournamentId: makeUuid(3),
      categoryId: makeUuid(4),
      status: 'rechazada',
      category: {
        id: makeUuid(4),
        name: 'A',
        substatus: null,
      },
      rosterEntries: [],
    });

    const service = new RegistrationsService(prisma, eligibility);

    await expect(
      service.addRosterEntry(
        makeUuid(1),
        { documentNumber: '40123456', name: 'Jugador Stub' },
        makeUuid(999),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects creating a registration when the team is blocked', async () => {
    const prisma = createPrismaMock();
    const eligibility = createEligibilityMock();
    prisma.team.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(100),
      sportId: makeUuid(500),
      name: 'Team Overtime',
    });
    prisma.tournament.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(200),
      status: 'OPEN',
      registrationStartDate: null,
      registrationEndDate: null,
    });
    prisma.category.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(300),
      tournamentId: makeUuid(200),
      tournament: {
        sportId: makeUuid(500),
      },
      name: 'A',
    });
    (eligibility.assertTeamEligibleForRegistration as jest.Mock).mockRejectedValue(
      new BadRequestException('blocked'),
    );

    const service = new RegistrationsService(prisma, eligibility);

    await expect(
      service.create(
        {
          teamId: makeUuid(100),
          tournamentId: makeUuid(200),
          categoryId: makeUuid(300),
          initialRoster: Array.from({ length: 8 }, (_, index) => ({
            documentNumber: `${40_000_000 + index}`,
            name: `Jugador ${index + 1}`,
          })),
        },
        makeUuid(999),
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
