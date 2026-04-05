import { BadRequestException } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { PrismaService } from '../database/prisma.service';

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

  it('rejects creating a registration with fewer than 8 players', async () => {
    const prisma = createPrismaMock();
    const service = new RegistrationsService(prisma);

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

    const service = new RegistrationsService(prisma);

    await expect(
      service.addRosterEntry(
        makeUuid(1),
        { documentNumber: '40123456', name: 'Jugador Stub' },
        makeUuid(999),
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
