import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  SanctionKindDto,
  SanctionTargetTypeDto,
} from '@overtime-mono/shared';
import { EligibilityService } from './eligibility.service';
import { PrismaService } from '../database/prisma.service';

describe('EligibilityService', () => {
  const makeUuid = (index: number): string =>
    `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;

  const createPrismaMock = () =>
    ({
      profile: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      profileTeam: {
        updateMany: jest.fn(),
      },
      blacklistEntry: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      sanction: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      team: {
        findUnique: jest.fn(),
      },
      match: {
        findUnique: jest.fn(),
      },
      matchStaff: {
        findFirst: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    }) as unknown as PrismaService;

  it('creates a blacklist entry and deactivates active team memberships', async () => {
    const prisma = createPrismaMock();
    prisma.profile.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(1),
      documentNumber: '40123456',
      name: 'Jugador',
    });
    prisma.blacklistEntry.findFirst = jest.fn().mockResolvedValue(null);
    prisma.$transaction = jest.fn().mockImplementation(async (callback) =>
      callback({
        blacklistEntry: {
          create: jest.fn().mockResolvedValue({
            id: makeUuid(100),
          }),
        },
        profileTeam: {
          updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      }),
    );

    const service = new EligibilityService(prisma);

    await service.createBlacklistEntry(
      {
        profileId: makeUuid(1),
        reason: 'DNI inválido',
      },
      makeUuid(999),
    );

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('allows an assigned referee to create a match sanction', async () => {
    const prisma = createPrismaMock();
    prisma.profile.findUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: makeUuid(1),
        role: 'referee',
      })
      .mockResolvedValueOnce({
        id: makeUuid(20),
        name: 'Jugador',
      });
    prisma.matchStaff.findFirst = jest.fn().mockResolvedValue({
      id: makeUuid(2),
    });
    prisma.match.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(10),
      categoryId: makeUuid(30),
      category: {
        tournamentId: makeUuid(40),
      },
    });
    prisma.category.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(30),
      tournamentId: makeUuid(40),
    });
    prisma.team.findUnique = jest.fn().mockResolvedValue(null);
    prisma.sanction.create = jest.fn().mockResolvedValue({
      id: makeUuid(50),
    });

    const service = new EligibilityService(prisma);

    await expect(
      service.createSanction(
        {
          targetType: SanctionTargetTypeDto.PROFILE,
          targetProfileId: makeUuid(20),
          kind: SanctionKindDto.DISCIPLINARY,
          reason: 'Expulsión',
          matchId: makeUuid(10),
        },
        makeUuid(1),
      ),
    ).resolves.toEqual({ id: makeUuid(50) });
  });

  it('rejects referee sanctions when the referee is not assigned to the match', async () => {
    const prisma = createPrismaMock();
    prisma.profile.findUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: makeUuid(1),
        role: 'referee',
      })
      .mockResolvedValueOnce({
        id: makeUuid(20),
        name: 'Jugador',
      });
    prisma.matchStaff.findFirst = jest.fn().mockResolvedValue(null);

    const service = new EligibilityService(prisma);

    await expect(
      service.createSanction(
        {
          targetType: SanctionTargetTypeDto.PROFILE,
          targetProfileId: makeUuid(20),
          kind: SanctionKindDto.DISCIPLINARY,
          reason: 'Expulsión',
          matchId: makeUuid(10),
        },
        makeUuid(1),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('requires matchId when a referee creates a sanction', async () => {
    const prisma = createPrismaMock();
    prisma.profile.findUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: makeUuid(1),
        role: 'referee',
      })
      .mockResolvedValueOnce({
        id: makeUuid(20),
        name: 'Jugador',
      });

    const service = new EligibilityService(prisma);

    await expect(
      service.createSanction(
        {
          targetType: SanctionTargetTypeDto.PROFILE,
          targetProfileId: makeUuid(20),
          kind: SanctionKindDto.DISCIPLINARY,
          reason: 'Expulsión',
        },
        makeUuid(1),
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
