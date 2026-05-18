import { NotFoundException } from '@nestjs/common';
import { BusinessError, ErrorCode } from '../../common/errors';
import { CategoriesService } from './categories.service';

describe('CategoriesService public reads', () => {
  const createPrismaMock = () =>
    ({
      category: {
        findUnique: jest.fn(),
      },
      zone: {
        findMany: jest.fn(),
      },
      match: {
        findMany: jest.fn(),
      },
    }) as const;

  const createService = (prisma: ReturnType<typeof createPrismaMock>) =>
    new CategoriesService(prisma as never, {} as never, {} as never);

  it('blocks public standings before PLAYING', async () => {
    const prisma = createPrismaMock();
    prisma.category.findUnique.mockResolvedValue({
      id: 'category-1',
      tournament: { status: 'IN_PROGRESS' },
    });

    const service = createService(prisma);

    await expect(service.computeStandings('category-1')).rejects.toMatchObject({
      code: ErrorCode.FIXTURE_NOT_PUBLISHED,
    } as Partial<BusinessError>);
  });

  it('allows standings for admin even before PLAYING', async () => {
    const prisma = createPrismaMock();
    prisma.category.findUnique.mockResolvedValue({
      id: 'category-1',
      tournament: { status: 'IN_PROGRESS' },
    });
    prisma.zone.findMany.mockResolvedValue([
      {
        id: 'zone-a',
        name: 'Zona A',
        teamZones: [
          { team: { id: 'team-1', name: 'Halcones', logoUrl: null } },
          { team: { id: 'team-2', name: 'Lobos', logoUrl: null } },
        ],
        matches: [
          {
            homeTeamId: 'team-1',
            awayTeamId: 'team-2',
            homeScore: 80,
            awayScore: 70,
          },
        ],
      },
    ]);

    const service = createService(prisma);

    await expect(
      service.computeStandings('category-1', 'admin'),
    ).resolves.toEqual({
      zones: [
        {
          id: 'zone-a',
          name: 'Zona A',
          standings: [
            {
              position: 1,
              teamId: 'team-1',
              teamName: 'Halcones',
              teamLogo: null,
              played: 1,
              won: 1,
              lost: 0,
              pointsFor: 80,
              pointsAgainst: 70,
              diff: 10,
              points: 2,
            },
            {
              position: 2,
              teamId: 'team-2',
              teamName: 'Lobos',
              teamLogo: null,
              played: 1,
              won: 0,
              lost: 1,
              pointsFor: 70,
              pointsAgainst: 80,
              diff: -10,
              points: 1,
            },
          ],
        },
      ],
    });
  });

  it('groups fixture by calendar day for public tournaments', async () => {
    const prisma = createPrismaMock();
    prisma.category.findUnique.mockResolvedValue({
      id: 'category-1',
      tournament: { status: 'PLAYING' },
    });
    prisma.match.findMany.mockResolvedValue([
      {
        id: 'match-1',
        matchDate: new Date('2026-05-20T20:00:00.000Z'),
        status: 'programado',
        matchType: 'regular',
        homeScore: 0,
        awayScore: 0,
        homeTeam: { id: 'team-1', name: 'Halcones', logoUrl: null },
        awayTeam: { id: 'team-2', name: 'Lobos', logoUrl: null },
        venue: { id: 'venue-1', name: 'Microestadio' },
        category: {
          id: 'category-1',
          name: 'Primera',
          slug: 'primera',
          tournament: { id: 't-1', name: 'Clausura', slug: 'clausura' },
        },
      },
      {
        id: 'match-2',
        matchDate: new Date('2026-05-20T22:00:00.000Z'),
        status: 'finalizado',
        matchType: 'regular',
        homeScore: 91,
        awayScore: 88,
        homeTeam: { id: 'team-3', name: 'Pumas', logoUrl: null },
        awayTeam: { id: 'team-4', name: 'Tigres', logoUrl: null },
        venue: { id: 'venue-1', name: 'Microestadio' },
        category: {
          id: 'category-1',
          name: 'Primera',
          slug: 'primera',
          tournament: { id: 't-1', name: 'Clausura', slug: 'clausura' },
        },
      },
      {
        id: 'match-3',
        matchDate: new Date('2026-05-27T20:00:00.000Z'),
        status: 'programado',
        matchType: 'regular',
        homeScore: 0,
        awayScore: 0,
        homeTeam: { id: 'team-1', name: 'Halcones', logoUrl: null },
        awayTeam: { id: 'team-3', name: 'Pumas', logoUrl: null },
        venue: { id: 'venue-2', name: 'Club Centro' },
        category: {
          id: 'category-1',
          name: 'Primera',
          slug: 'primera',
          tournament: { id: 't-1', name: 'Clausura', slug: 'clausura' },
        },
      },
    ]);

    const service = createService(prisma);

    await expect(service.getFixture('category-1')).resolves.toEqual({
      rounds: [
        {
          name: 'Fecha 1',
          date: '2026-05-20T20:00:00.000Z',
          matches: [
            {
              id: 'match-1',
              tournamentSlug: 'clausura',
              categorySlug: 'primera',
              date: '2026-05-20T20:00:00.000Z',
              location: 'Microestadio',
              matchType: 'regular',
              team1: { id: 'team-1', name: 'Halcones', logoUrl: null },
              team2: { id: 'team-2', name: 'Lobos', logoUrl: null },
              team1Score: null,
              team2Score: null,
            },
            {
              id: 'match-2',
              tournamentSlug: 'clausura',
              categorySlug: 'primera',
              date: '2026-05-20T22:00:00.000Z',
              location: 'Microestadio',
              matchType: 'regular',
              team1: { id: 'team-3', name: 'Pumas', logoUrl: null },
              team2: { id: 'team-4', name: 'Tigres', logoUrl: null },
              team1Score: 91,
              team2Score: 88,
            },
          ],
        },
        {
          name: 'Fecha 2',
          date: '2026-05-27T20:00:00.000Z',
          matches: [
            {
              id: 'match-3',
              tournamentSlug: 'clausura',
              categorySlug: 'primera',
              date: '2026-05-27T20:00:00.000Z',
              location: 'Club Centro',
              matchType: 'regular',
              team1: { id: 'team-1', name: 'Halcones', logoUrl: null },
              team2: { id: 'team-3', name: 'Pumas', logoUrl: null },
              team1Score: null,
              team2Score: null,
            },
          ],
        },
      ],
    });
  });

  it('throws 404 for fixture on unknown category', async () => {
    const prisma = createPrismaMock();
    prisma.category.findUnique.mockResolvedValue(null);

    const service = createService(prisma);

    await expect(service.getFixture('missing')).rejects.toThrow(
      new NotFoundException('Category with ID missing not found'),
    );
  });
});
