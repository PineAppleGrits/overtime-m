import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EligibilityService } from '../eligibility/eligibility.service';
import { BusinessError, ErrorCode } from '../common/errors';
import { MediaAssetService } from '../common/storage/media-asset.service';
import { SportRulesRegistry } from '../common/sport-rules/sport-rules.registry';
import { TeamsService } from './application/services/teams.service';

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
      profileTeam: {
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      team: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
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

  const createMediaAssetsMock = () =>
    ({
      upload: jest.fn(),
      getAccessUrl: jest.fn(),
      delete: jest.fn(),
    }) as unknown as MediaAssetService;

  const createSportRulesMock = () => new SportRulesRegistry();

  const buildService = (
    prisma: PrismaService,
    eligibility: EligibilityService = createEligibilityMock(),
  ) =>
    new TeamsService(
      prisma,
      eligibility,
      createMediaAssetsMock(),
      createSportRulesMock(),
    );

  it('rejects tournament-scoped team creation before the operational window opens', async () => {
    const prisma = createPrismaMock();
    prisma.tournament.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(1),
      name: 'Clausura 2026',
      sportId: makeUuid(2),
      teamOperationsOpenAt: new Date('2099-01-01T00:00:00.000Z'),
      teamOperationsCloseAt: null,
    });

    const service = buildService(prisma);

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

    const service = buildService(prisma);

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

    const service = buildService(prisma, eligibility);

    await expect(
      service.addPlayer(makeUuid(1), {
        profileId: makeUuid(2),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('blocks team creation when the creator has no DNI loaded (RN-034)', async () => {
    const prisma = createPrismaMock();
    prisma.profile.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(50),
      documentNumber: null,
      documentVerified: false,
    });

    const service = buildService(prisma);

    await expect(
      service.create(
        { name: 'Sin DNI', sportId: makeUuid(2) },
        makeUuid(50),
      ),
    ).rejects.toMatchObject({
      code: ErrorCode.PROFILE_DNI_REQUIRED,
    } as Partial<BusinessError>);
  });

  it('blocks team creation when the creator DNI is not verified (RN-034)', async () => {
    const prisma = createPrismaMock();
    prisma.profile.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(51),
      documentNumber: '12345678',
      documentVerified: false,
    });

    const service = buildService(prisma);

    await expect(
      service.create(
        { name: 'DNI sin verificar', sportId: makeUuid(2) },
        makeUuid(51),
      ),
    ).rejects.toMatchObject({
      code: ErrorCode.PROFILE_DNI_NOT_VERIFIED,
    } as Partial<BusinessError>);
  });

  it('blocks adding a player that already plays in another team of the same sport (RN-002)', async () => {
    const prisma = createPrismaMock();
    prisma.team.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(60),
      name: 'Equipo destino',
      sportId: makeUuid(70),
      sport: { id: makeUuid(70) },
      creator: null,
      captain: null,
      members: [],
      teamZones: [],
      registrations: [],
    });
    prisma.profile.findUnique = jest.fn().mockResolvedValue({
      id: makeUuid(80),
      name: 'Jugador',
    });
    (prisma.profileTeam.findFirst as jest.Mock)
      // primer findFirst: existingMembership en este equipo
      .mockResolvedValueOnce(null)
      // segundo findFirst: conflicto en otro equipo del mismo deporte
      .mockResolvedValueOnce({
        id: makeUuid(90),
        teamId: makeUuid(91),
        team: {
          id: makeUuid(91),
          name: 'Otro equipo',
          sportId: makeUuid(70),
        },
      });

    const service = buildService(prisma);

    await expect(
      service.addPlayer(makeUuid(60), { profileId: makeUuid(80) }),
    ).rejects.toMatchObject({
      code: ErrorCode.TEAM_PLAYER_ALREADY_IN_OTHER_TEAM,
    } as Partial<BusinessError>);
  });
});
