import { EventEmitter2 } from '@nestjs/event-emitter';
import { CategoryStatus, CategorySubstatus } from '@prisma/client';
import { DomainEvent } from '../../../../common/events/domain-events';
import { TransitionCategorySubstatusUseCase } from './transition-substatus.use-case';

describe('TransitionCategorySubstatusUseCase', () => {
  function build(category: any) {
    const prisma = {
      category: {
        findUnique: jest.fn().mockResolvedValue(category),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const events = { emit: jest.fn() } as unknown as EventEmitter2;
    const sut = new TransitionCategorySubstatusUseCase(
      prisma as any,
      events as any,
    );
    return { sut, prisma, events };
  }

  it('emite category.playoffs.started al pasar a PLAYOFFS_FASE', async () => {
    const { sut, prisma, events } = build({
      id: 'cat1',
      substatus: CategorySubstatus.REGULAR_FASE,
      status: CategoryStatus.IN_PROGRESS,
    });

    await sut.execute('cat1', { kind: 'startPlayoffs' });

    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 'cat1' },
      data: { substatus: CategorySubstatus.PLAYOFFS_FASE },
    });
    expect(events.emit).toHaveBeenCalledWith(
      DomainEvent.CATEGORY_PLAYOFFS_STARTED,
      { categoryId: 'cat1' },
    );
  });

  it('startPlayoffs es idempotente si ya está en PLAYOFFS_FASE', async () => {
    const { sut, prisma, events } = build({
      id: 'cat1',
      substatus: CategorySubstatus.PLAYOFFS_FASE,
      status: CategoryStatus.IN_PROGRESS,
    });

    await sut.execute('cat1', { kind: 'startPlayoffs' });

    expect(prisma.category.update).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('emite category.finished al finalizar', async () => {
    const { sut, prisma, events } = build({
      id: 'cat1',
      substatus: CategorySubstatus.PLAYOFFS_FASE,
      status: CategoryStatus.IN_PROGRESS,
    });

    await sut.execute('cat1', {
      kind: 'finish',
      championTeamId: 'tA',
      runnerUpTeamId: 'tB',
      lastTeamId: 'tZ',
    });

    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: 'cat1' },
      data: { status: CategoryStatus.FINISHED },
    });
    expect(events.emit).toHaveBeenCalledWith(DomainEvent.CATEGORY_FINISHED, {
      categoryId: 'cat1',
      championTeamId: 'tA',
      runnerUpTeamId: 'tB',
      lastTeamId: 'tZ',
    });
  });

  it('finish lanza si la categoría no está en PLAYOFFS_FASE ni null', async () => {
    const { sut } = build({
      id: 'cat1',
      substatus: CategorySubstatus.REGULAR_FASE,
      status: CategoryStatus.IN_PROGRESS,
    });

    await expect(sut.execute('cat1', { kind: 'finish' })).rejects.toThrow(
      /fase de playoffs/,
    );
  });
});
