import { ConflictException } from '@nestjs/common';
import { MatchStatus } from '@overtime-mono/shared';
import { PrismaService } from '../database/prisma.service';
import { EligibilityService } from '../eligibility/eligibility.service';
import { VenuesService } from '../venues/venues.service';
import { MatchesService } from './matches.service';

describe('MatchesService', () => {
  const makeUuid = (index: number): string =>
    `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;

  const createPrismaMock = () =>
    ({
      match: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    }) as unknown as PrismaService;

  const createEligibilityMock = () =>
    ({
      assertTeamEligibleForMatch: jest.fn(),
    }) as unknown as EligibilityService;

  const createVenuesMock = () =>
    ({
      checkAvailability: jest.fn(),
    }) as unknown as VenuesService;

  it('rejects moving a match to en_curso when a team has an active sanction', async () => {
    const prisma = createPrismaMock();
    const eligibility = createEligibilityMock();
    const service = new MatchesService(
      prisma,
      createVenuesMock(),
      eligibility,
    );

    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: makeUuid(1),
      status: MatchStatus.PROGRAMADO,
      homeTeamId: makeUuid(10),
      awayTeamId: makeUuid(11),
      category: {
        id: makeUuid(20),
        tournament: {
          id: makeUuid(30),
        },
      },
    } as never);

    (eligibility.assertTeamEligibleForMatch as jest.Mock).mockRejectedValue(
      new ConflictException('blocked'),
    );

    await expect(
      service.changeStatus(makeUuid(1), {
        status: MatchStatus.EN_CURSO,
      }),
    ).rejects.toThrow(ConflictException);

    expect(prisma.match.update).not.toHaveBeenCalled();
  });
});
