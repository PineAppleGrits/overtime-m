import { BusinessError, ErrorCode } from '../../../common/errors';
import { PrismaService } from '../../../database/prisma.service';
import { TeamCategoryLevel } from '../../domain/entities/team-category-level.entity';
import { ITeamCategoryLevelRepository } from '../ports/team-category-level.repository';
import { CategorizationCheckService } from './categorization-check.service';

const buildAssignment = (
  id: string,
  teamId: string,
  categoryLevelId: string,
): TeamCategoryLevel =>
  new TeamCategoryLevel(
    id,
    teamId,
    categoryLevelId,
    'admin-1',
    new Date(),
    null,
  );

describe('CategorizationCheckService', () => {
  const teamId = 'team-1';
  const categoryId = 'cat-1';

  const createMocks = () => {
    const teamRepo: jest.Mocked<ITeamCategoryLevelRepository> = {
      listByTeam: jest.fn(),
      replaceForTeam: jest.fn(),
      addForTeam: jest.fn(),
      removeForTeam: jest.fn(),
      hasLevel: jest.fn(),
      listPendingCategorization: jest.fn(),
    };

    const prisma = {
      category: {
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService & {
      category: { findUnique: jest.Mock };
    };

    return { teamRepo, prisma };
  };

  it('bloquea cuando el equipo no tiene niveles (RN-039)', async () => {
    const { teamRepo, prisma } = createMocks();
    teamRepo.listByTeam.mockResolvedValue([]);
    (
      prisma.category.findUnique as jest.Mock
    ).mockResolvedValue({ id: categoryId, categoryLevelId: 'lvl-A' });

    const service = new CategorizationCheckService(teamRepo, prisma);

    const result = await service.check(teamId, categoryId);
    expect(result.canRegister).toBe(false);
    expect(result.reason).toBe('TEAM_NOT_CATEGORIZED');

    await expect(
      service.assertCanRegisterToCategory(teamId, categoryId),
    ).rejects.toMatchObject({
      code: ErrorCode.TEAM_NOT_CATEGORIZED,
    } as Partial<BusinessError>);
  });

  it('bloquea cuando el nivel del equipo no incluye el de la categoría (RN-044)', async () => {
    const { teamRepo, prisma } = createMocks();
    teamRepo.listByTeam.mockResolvedValue([
      buildAssignment('a-1', teamId, 'lvl-B'),
    ]);
    (prisma.category.findUnique as jest.Mock).mockResolvedValue({
      id: categoryId,
      categoryLevelId: 'lvl-A',
    });

    const service = new CategorizationCheckService(teamRepo, prisma);

    await expect(
      service.assertCanRegisterToCategory(teamId, categoryId),
    ).rejects.toMatchObject({
      code: ErrorCode.TEAM_NOT_ELIGIBLE_FOR_CATEGORY,
    } as Partial<BusinessError>);
  });

  it('permite si la categoría no tiene nivel objetivo configurado', async () => {
    const { teamRepo, prisma } = createMocks();
    teamRepo.listByTeam.mockResolvedValue([
      buildAssignment('a-1', teamId, 'lvl-B'),
    ]);
    (prisma.category.findUnique as jest.Mock).mockResolvedValue({
      id: categoryId,
      categoryLevelId: null,
    });

    const service = new CategorizationCheckService(teamRepo, prisma);

    const result = await service.check(teamId, categoryId);
    expect(result.canRegister).toBe(true);

    await expect(
      service.assertCanRegisterToCategory(teamId, categoryId),
    ).resolves.toBeUndefined();
  });

  it('permite cuando el equipo posee el nivel objetivo', async () => {
    const { teamRepo, prisma } = createMocks();
    teamRepo.listByTeam.mockResolvedValue([
      buildAssignment('a-1', teamId, 'lvl-A'),
    ]);
    (prisma.category.findUnique as jest.Mock).mockResolvedValue({
      id: categoryId,
      categoryLevelId: 'lvl-A',
    });

    const service = new CategorizationCheckService(teamRepo, prisma);

    const result = await service.check(teamId, categoryId);
    expect(result.canRegister).toBe(true);
    expect(result.targetCategoryLevelId).toBe('lvl-A');
    expect(result.teamLevelIds).toEqual(['lvl-A']);
  });

  it('lanza NOT_FOUND si la categoría no existe', async () => {
    const { teamRepo, prisma } = createMocks();
    teamRepo.listByTeam.mockResolvedValue([]);
    (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

    const service = new CategorizationCheckService(teamRepo, prisma);

    await expect(
      service.check(teamId, categoryId),
    ).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
    } as Partial<BusinessError>);
  });
});
