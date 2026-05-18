import { BadRequestException, ConflictException } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../common/errors';
import type { TeamEligibilityPort } from './application/ports/team-eligibility.port';
import type { TeamMediaPort } from './application/ports/team-media.port';
import type { TeamRepository } from './application/ports/team-repository.port';
import type { TeamSportRulesPort } from './application/ports/team-sport-rules.port';
import type { TeamTournamentContextPort } from './application/ports/team-tournament-context.port';
import { TeamsService } from './application/services/teams.service';

describe('TeamsService', () => {
  const makeUuid = (index: number): string =>
    `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;

  const createRepositoryMock = (): jest.Mocked<TeamRepository> =>
    ({
      isTeamSlugTaken: jest.fn(),
      isFranchiseSlugTaken: jest.fn(),
      findCreatorProfileById: jest.fn(),
      findSportById: jest.fn(),
      findCaptainProfileById: jest.fn(),
      createTeam: jest.fn(),
      findProfileDocumentNumber: jest.fn(),
      listMyTeams: jest.fn(),
      listTeams: jest.fn(),
      findTeamDetailById: jest.fn(),
      updateTeam: jest.fn(),
      softDeleteTeam: jest.fn(),
      findProfileById: jest.fn(),
      findMembership: jest.fn(),
      reactivateMembership: jest.fn(),
      findConflictingMembership: jest.fn(),
      createMembership: jest.fn(),
      deactivateMembership: jest.fn(),
      assignCaptain: jest.fn(),
      findPromotionCandidate: jest.fn(),
      promoteToFranchise: jest.fn(),
      findSportCodeByTeamId: jest.fn(),
      countActiveTeamMembers: jest.fn(),
      findLogoByTeamId: jest.fn(),
      updateTeamLogoAsset: jest.fn(),
      findTeamExists: jest.fn(),
      findLastMatchPreview: jest.fn(),
      findNextMatchPreview: jest.fn(),
      findBalanceAccess: jest.fn(),
      findDebtsByTeamId: jest.fn(),
      findRegistrationSummariesByTeamId: jest.fn(),
      findPaymentProofAssets: jest.fn(),
      findActiveRosterProfileIds: jest.fn(),
      findActiveProfileSanctions: jest.fn(),
    });

  const createTournamentContextMock = (): jest.Mocked<TeamTournamentContextPort> =>
    ({
      findTournamentForOperations: jest.fn(),
    });

  const createEligibilityMock = (): jest.Mocked<TeamEligibilityPort> =>
    ({
      assertProfileNotBlacklisted: jest.fn(),
    });

  const createMediaMock = (): jest.Mocked<TeamMediaPort> =>
    ({
      upload: jest.fn(),
      getAccessUrl: jest.fn(),
      delete: jest.fn(),
    });

  const createSportRulesMock = (): jest.Mocked<TeamSportRulesPort> =>
    ({
      getRosterBounds: jest.fn(),
    });

  const buildService = (
    repository: TeamRepository,
    tournamentContext: TeamTournamentContextPort = createTournamentContextMock(),
    eligibility: TeamEligibilityPort = createEligibilityMock(),
  ) =>
    new TeamsService(
      repository,
      tournamentContext,
      eligibility,
      createMediaMock(),
      createSportRulesMock(),
    );

  it('rejects tournament-scoped team creation before the operational window opens', async () => {
    const repository = createRepositoryMock();
    const tournamentContext = createTournamentContextMock();
    tournamentContext.findTournamentForOperations.mockResolvedValue({
      id: makeUuid(1),
      name: 'Clausura 2026',
      sportId: makeUuid(2),
      teamOperationsOpenAt: new Date('2099-01-01T00:00:00.000Z'),
      teamOperationsCloseAt: null,
    });

    const service = buildService(repository, tournamentContext);

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
    const repository = createRepositoryMock();
    repository.findPromotionCandidate.mockResolvedValue({
      id: makeUuid(10),
      name: 'Team Overtime',
      logoUrl: null,
      creatorId: makeUuid(111),
      franchiseId: null,
    });

    const service = buildService(repository);

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
    const repository = createRepositoryMock();
    const eligibility = createEligibilityMock();
    repository.findTeamDetailById.mockResolvedValue({
      id: makeUuid(1),
      name: 'Team Overtime',
      sport: {},
      sportId: makeUuid(70),
      creator: null,
      captain: null,
      members: [],
      teamZones: [],
      registrations: [],
    });
    repository.findProfileById.mockResolvedValue({
      id: makeUuid(2),
      name: 'Jugador Bloqueado',
    });
    (eligibility.assertProfileNotBlacklisted as jest.Mock).mockRejectedValue(
      new ConflictException('blocked'),
    );

    const service = buildService(repository, createTournamentContextMock(), eligibility);

    await expect(
      service.addPlayer(makeUuid(1), {
        profileId: makeUuid(2),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('blocks team creation when the creator has no DNI loaded (RN-034)', async () => {
    const repository = createRepositoryMock();
    repository.findCreatorProfileById.mockResolvedValue({
      id: makeUuid(50),
      documentNumber: null,
      documentVerified: false,
    });

    const service = buildService(repository);

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
    const repository = createRepositoryMock();
    repository.findCreatorProfileById.mockResolvedValue({
      id: makeUuid(51),
      documentNumber: '12345678',
      documentVerified: false,
    });

    const service = buildService(repository);

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
    const repository = createRepositoryMock();
    repository.findTeamDetailById.mockResolvedValue({
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
    repository.findProfileById.mockResolvedValue({
      id: makeUuid(80),
      name: 'Jugador',
    });
    (repository.findMembership as jest.Mock)
      // primer findFirst: existingMembership en este equipo
      .mockResolvedValueOnce(null)
      // no hay membership activa en el equipo destino
      .mockResolvedValueOnce(null);
    repository.findConflictingMembership.mockResolvedValue({
      id: makeUuid(90),
      team: {
        id: makeUuid(91),
        name: 'Otro equipo',
        sportId: makeUuid(70),
      },
    });

    const service = buildService(repository);

    await expect(
      service.addPlayer(makeUuid(60), { profileId: makeUuid(80) }),
    ).rejects.toMatchObject({
      code: ErrorCode.TEAM_PLAYER_ALREADY_IN_OTHER_TEAM,
    } as Partial<BusinessError>);
  });

  it('returns last and next match previews for the team', async () => {
    const repository = createRepositoryMock();
    repository.findTeamExists.mockResolvedValue({ id: makeUuid(1) });
    repository.findLastMatchPreview.mockResolvedValue({
      id: makeUuid(2),
      matchDate: new Date('2026-05-10T20:00:00.000Z'),
      status: 'finalizado',
      matchType: 'regular',
      homeScore: 77,
      awayScore: 70,
      homeTeam: { id: makeUuid(3), name: 'Halcones', logoUrl: null },
      awayTeam: { id: makeUuid(4), name: 'Lobos', logoUrl: null },
      venue: { id: makeUuid(5), name: 'Microestadio' },
      category: {
        id: makeUuid(6),
        name: 'Primera',
        slug: 'primera',
        tournament: {
          id: makeUuid(7),
          name: 'Clausura',
          slug: 'clausura',
        },
      },
    });
    repository.findNextMatchPreview.mockResolvedValue({
      id: makeUuid(8),
      matchDate: new Date('2026-05-24T20:00:00.000Z'),
      status: 'programado',
      matchType: 'playoff',
      homeScore: 0,
      awayScore: 0,
      homeTeam: { id: makeUuid(3), name: 'Halcones', logoUrl: null },
      awayTeam: { id: makeUuid(9), name: 'Pumas', logoUrl: null },
      venue: { id: makeUuid(10), name: 'Club Centro' },
      category: {
        id: makeUuid(6),
        name: 'Primera',
        slug: 'primera',
        tournament: {
          id: makeUuid(7),
          name: 'Clausura',
          slug: 'clausura',
        },
      },
    });

    const service = buildService(repository);

    await expect(service.findTeamMatches(makeUuid(1))).resolves.toEqual({
      lastMatch: {
        id: makeUuid(2),
        tournamentSlug: 'clausura',
        categorySlug: 'primera',
        date: '2026-05-10T20:00:00.000Z',
        location: 'Microestadio',
        matchType: 'regular',
        team1: { id: makeUuid(3), name: 'Halcones', logoUrl: null },
        team2: { id: makeUuid(4), name: 'Lobos', logoUrl: null },
        team1Score: 77,
        team2Score: 70,
      },
      nextMatch: {
        id: makeUuid(8),
        tournamentSlug: 'clausura',
        categorySlug: 'primera',
        date: '2026-05-24T20:00:00.000Z',
        location: 'Club Centro',
        matchType: 'playoff',
        team1: { id: makeUuid(3), name: 'Halcones', logoUrl: null },
        team2: { id: makeUuid(9), name: 'Pumas', logoUrl: null },
        team1Score: null,
        team2Score: null,
      },
    });
  });

  it('does not query last match when requesting only next', async () => {
    const repository = createRepositoryMock();
    repository.findTeamExists.mockResolvedValue({ id: makeUuid(1) });
    repository.findNextMatchPreview.mockResolvedValue(null);

    const service = buildService(repository);

    await expect(
      service.findTeamMatches(makeUuid(1), 'next'),
    ).resolves.toEqual({
      lastMatch: null,
      nextMatch: null,
    });
    expect(repository.findLastMatchPreview).not.toHaveBeenCalled();
    expect(repository.findNextMatchPreview).toHaveBeenCalledWith(makeUuid(1));
  });
});
