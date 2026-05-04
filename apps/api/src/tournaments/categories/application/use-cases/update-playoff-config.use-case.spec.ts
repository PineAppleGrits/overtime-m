import { CategorySubstatus, PlayoffFormat } from '@prisma/client';
import { BusinessError, ErrorCode } from '../../../../common/errors';
import { GetPlayoffConfigUseCase } from './get-playoff-config.use-case';
import { UpdatePlayoffConfigUseCase } from './update-playoff-config.use-case';

describe('UpdatePlayoffConfigUseCase', () => {
  type MockPrisma = {
    category: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  function buildSut(category: any | null) {
    const prisma: MockPrisma = {
      category: {
        findUnique: jest.fn().mockResolvedValue(category),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const getConfig = {
      execute: jest.fn().mockResolvedValue({ categoryId: 'cat1' }),
    } as unknown as GetPlayoffConfigUseCase;
    const sut = new UpdatePlayoffConfigUseCase(prisma as any, getConfig);
    return { sut, prisma, getConfig };
  }

  it('lanza NotFound si la categoría no existe', async () => {
    const { sut } = buildSut(null);
    await expect(sut.execute('cat1', { zonesCount: 1 })).rejects.toThrow(
      'not found',
    );
  });

  it('rechaza con CATEGORY_PLAYOFF_FORMAT_LOCKED si ya está en PLAYOFFS_FASE', async () => {
    const { sut } = buildSut({
      id: 'cat1',
      substatus: CategorySubstatus.PLAYOFFS_FASE,
    });
    await expect(
      sut.execute('cat1', { playoffFormatByRound: { final: PlayoffFormat.BO5 } }),
    ).rejects.toMatchObject({ code: ErrorCode.CATEGORY_PLAYOFF_FORMAT_LOCKED });
  });

  it('rechaza con CATEGORY_TOO_MANY_ZONES si zonesCount > 2', async () => {
    const { sut } = buildSut({
      id: 'cat1',
      substatus: CategorySubstatus.REGULAR_FASE,
    });
    await expect(
      sut.execute('cat1', { zonesCount: 3 as any }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  it('aplica el patch y delega en GetPlayoffConfig para el response', async () => {
    const { sut, prisma, getConfig } = buildSut({
      id: 'cat1',
      substatus: null,
    });

    await sut.execute('cat1', {
      zonesCount: 2,
      hasThirdPlaceMatch: true,
      playoffFormatByRound: { final: PlayoffFormat.BO5 },
    });

    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 'cat1' },
      data: expect.objectContaining({
        zonesCount: 2,
        hasThirdPlaceMatch: true,
      }),
    });
    expect(getConfig.execute).toHaveBeenCalledWith('cat1');
  });
});
