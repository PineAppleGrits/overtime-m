import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { CategoryLevel } from '../../../category-levels/domain/entities/category-level.entity';
import { LevelCode } from '../../../category-levels/domain/value-objects/level-code.vo';
import { ICategoryLevelRepository } from '../../../category-levels/application/ports/category-level.repository';
import { PrismaService } from '../../../database/prisma.service';
import { TeamCategoryLevel } from '../../domain/entities/team-category-level.entity';
import { ITeamCategoryLevelRepository } from '../ports/team-category-level.repository';
import { AssignTeamCategorizationUseCase } from './assign-team-categorization.use-case';

const buildLevel = (id: string, code: string, rank: number): CategoryLevel =>
  new CategoryLevel(
    id,
    'sport-1',
    LevelCode.create(code),
    code,
    rank,
    new Date(),
    new Date(),
  );

const buildAssignment = (
  id: string,
  teamId: string,
  categoryLevelId: string,
): TeamCategoryLevel =>
  new TeamCategoryLevel(id, teamId, categoryLevelId, 'admin-1', new Date(), null);

describe('AssignTeamCategorizationUseCase', () => {
  const teamId = 'team-1';
  const adminId = 'admin-1';

  const createMocks = () => {
    const teamRepo: jest.Mocked<ITeamCategoryLevelRepository> = {
      listByTeam: jest.fn(),
      replaceForTeam: jest.fn(),
      addForTeam: jest.fn(),
      removeForTeam: jest.fn(),
      hasLevel: jest.fn(),
      listPendingCategorization: jest.fn(),
    };

    const categoryLevelsRepo: jest.Mocked<ICategoryLevelRepository> = {
      findById: jest.fn(),
      findBySportAndCode: jest.fn(),
      listBySport: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countTeamsAssigned: jest.fn(),
      countCategoriesUsing: jest.fn(),
    };

    const prisma = {
      team: {
        findUnique: jest.fn(),
      },
    } as unknown as {
      team: { findUnique: jest.Mock };
    };

    const events = {
      emit: jest.fn(),
    } as unknown as EventEmitter2;

    return { teamRepo, categoryLevelsRepo, prisma, events };
  };

  it('reemplaza niveles cuando replace=true y emite TEAM_CATEGORIZED', async () => {
    const { teamRepo, categoryLevelsRepo, prisma, events } = createMocks();

    prisma.team.findUnique.mockResolvedValue({
      id: teamId,
      sportId: 'sport-1',
    });
    categoryLevelsRepo.findBySportAndCode.mockImplementation(
      async (_sportId, code) => buildLevel(`lvl-${code}`, code, 1),
    );
    teamRepo.replaceForTeam.mockResolvedValue([
      buildAssignment('a-1', teamId, 'lvl-A'),
      buildAssignment('a-2', teamId, 'lvl-B'),
    ]);

    const useCase = new AssignTeamCategorizationUseCase(
      teamRepo,
      categoryLevelsRepo,
      prisma as unknown as PrismaService,
      events,
    );

    const result = await useCase.execute({
      teamId,
      levelCodes: ['A', 'B'],
      grantedByProfileId: adminId,
      replace: true,
    });

    expect(result).toHaveLength(2);
    expect(teamRepo.replaceForTeam).toHaveBeenCalledTimes(1);
    expect(teamRepo.addForTeam).not.toHaveBeenCalled();
    expect((events as unknown as { emit: jest.Mock }).emit).toHaveBeenCalledWith(
      'team.categorized',
      expect.objectContaining({ teamId }),
    );
  });

  it('rechaza si exceden el máximo (RN-044) al agregar sin reemplazar', async () => {
    const { teamRepo, categoryLevelsRepo, prisma, events } = createMocks();

    prisma.team.findUnique.mockResolvedValue({
      id: teamId,
      sportId: 'sport-1',
    });
    categoryLevelsRepo.findBySportAndCode.mockImplementation(
      async (_sportId, code) => buildLevel(`lvl-${code}`, code, 1),
    );
    teamRepo.listByTeam.mockResolvedValue([
      buildAssignment('a-1', teamId, 'lvl-A'),
      buildAssignment('a-2', teamId, 'lvl-B'),
    ]);

    const useCase = new AssignTeamCategorizationUseCase(
      teamRepo,
      categoryLevelsRepo,
      prisma as unknown as PrismaService,
      events,
    );

    await expect(
      useCase.execute({
        teamId,
        levelCodes: ['C'],
        grantedByProfileId: adminId,
        replace: false,
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_FAILED,
    } as Partial<BusinessError>);
  });

  it('rechaza body con más de 2 niveles', async () => {
    const { teamRepo, categoryLevelsRepo, prisma, events } = createMocks();
    const useCase = new AssignTeamCategorizationUseCase(
      teamRepo,
      categoryLevelsRepo,
      prisma as unknown as PrismaService,
      events,
    );

    await expect(
      useCase.execute({
        teamId,
        levelCodes: ['A', 'B', 'C'],
        grantedByProfileId: adminId,
        replace: true,
      }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  it('lanza NOT_FOUND si un código no existe para el deporte', async () => {
    const { teamRepo, categoryLevelsRepo, prisma, events } = createMocks();
    prisma.team.findUnique.mockResolvedValue({
      id: teamId,
      sportId: 'sport-1',
    });
    categoryLevelsRepo.findBySportAndCode.mockResolvedValue(null);

    const useCase = new AssignTeamCategorizationUseCase(
      teamRepo,
      categoryLevelsRepo,
      prisma as unknown as PrismaService,
      events,
    );

    await expect(
      useCase.execute({
        teamId,
        levelCodes: ['Z'],
        grantedByProfileId: adminId,
        replace: true,
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    } as Partial<BusinessError>);
  });
});
