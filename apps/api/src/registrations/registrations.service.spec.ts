import { BadRequestException } from '@nestjs/common';
import {
  type RegistrationEligibilityPort,
} from './application/ports/registration-eligibility.port';
import {
  type RegistrationEventsPort,
} from './application/ports/registration-events.port';
import {
  type RegistrationRepository,
} from './application/ports/registration-repository.port';
import type { RegistrationRosterContextPort } from './application/ports/registration-roster-context.port';
import { RegistrationsService } from './application/services/registrations.service';

describe('RegistrationsService', () => {
  const makeUuid = (index: number): string =>
    `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;

  const createRepositoryMock = (): jest.Mocked<RegistrationRepository> =>
    ({
      findTeamById: jest.fn(),
      findTournamentById: jest.fn(),
      findCategoryById: jest.fn(),
      findExistingActiveRegistration: jest.fn(),
      findDetailById: jest.fn(),
      findEditableById: jest.fn(),
      list: jest.fn(),
      createPendingRegistration: jest.fn(),
      addRosterEntry: jest.fn(),
      findRosterConflicts: jest.fn(),
      countScheduledRegularMatches: jest.fn(),
      countRemainingRegularMatches: jest.fn(),
      approveRegistration: jest.fn(),
      rejectRegistration: jest.fn(),
      deleteRegistration: jest.fn(),
    });

  const createRosterContextMock = (): jest.Mocked<RegistrationRosterContextPort> =>
    ({
      resolvePlayers: jest.fn(),
    });

  const createEligibilityMock = (): jest.Mocked<RegistrationEligibilityPort> =>
    ({
      assertProfileEligibleForRegistration: jest.fn(),
      assertTeamEligibleForRegistration: jest.fn(),
    });

  const createEventsMock = (): jest.Mocked<RegistrationEventsPort> =>
    ({
      emitApproved: jest.fn(),
      emitRejected: jest.fn(),
    });

  it('rejects creating a registration with fewer than 8 players', async () => {
    const service = new RegistrationsService(
      createRepositoryMock(),
      createRosterContextMock(),
      createEligibilityMock(),
      createEventsMock(),
    );

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
    const repository = createRepositoryMock();
    const rosterContext = createRosterContextMock();
    const eligibility = createEligibilityMock();
    repository.findEditableById.mockResolvedValue({
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

    const service = new RegistrationsService(
      repository,
      rosterContext,
      eligibility,
      createEventsMock(),
    );

    await expect(
      service.addRosterEntry(
        makeUuid(1),
        { documentNumber: '40123456', name: 'Jugador Stub' },
        makeUuid(999),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects creating a registration when the team is blocked', async () => {
    const repository = createRepositoryMock();
    const eligibility = createEligibilityMock();
    repository.findTeamById.mockResolvedValue({
      id: makeUuid(100),
      name: 'Team Overtime',
      sportId: makeUuid(500),
    });
    repository.findTournamentById.mockResolvedValue({
      id: makeUuid(200),
      status: 'OPEN',
      name: 'Apertura',
      registrationStartDate: null,
      registrationEndDate: null,
    });
    repository.findCategoryById.mockResolvedValue({
      id: makeUuid(300),
      tournamentId: makeUuid(200),
      name: 'A',
      tournament: {
        sportId: makeUuid(500),
      },
    });
    repository.findExistingActiveRegistration.mockResolvedValue(null);
    (eligibility.assertTeamEligibleForRegistration as jest.Mock).mockRejectedValue(
      new BadRequestException('blocked'),
    );

    const service = new RegistrationsService(
      repository,
      createRosterContextMock(),
      eligibility,
      createEventsMock(),
    );

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
