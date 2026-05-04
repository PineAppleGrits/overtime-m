import { ErrorCode } from '../../../../common/errors';
import { AutoBalanceTeamsUseCase } from './auto-balance-teams.use-case';

describe('AutoBalanceTeamsUseCase', () => {
  function buildSut(opts: {
    category: any | null;
    zones: any[];
    registrations: any[];
    existing: any[];
  }) {
    const prisma = {
      category: { findUnique: jest.fn().mockResolvedValue(opts.category) },
      zone: { findMany: jest.fn().mockResolvedValue(opts.zones) },
      registration: { findMany: jest.fn().mockResolvedValue(opts.registrations) },
      teamZone: {
        findMany: jest.fn().mockResolvedValue(opts.existing),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const sut = new AutoBalanceTeamsUseCase(prisma as any);
    return { sut, prisma };
  }

  it('lanza si la categoría no existe', async () => {
    const { sut } = buildSut({
      category: null,
      zones: [],
      registrations: [],
      existing: [],
    });
    await expect(sut.execute('cat1')).rejects.toThrow('not found');
  });

  it('lanza CATEGORY_TOO_MANY_ZONES si faltan zonas para llegar al zonesCount', async () => {
    const { sut } = buildSut({
      category: { id: 'cat1', tournamentId: 't1', zonesCount: 2 },
      zones: [{ id: 'zA', name: 'A' }],
      registrations: [],
      existing: [],
    });
    await expect(sut.execute('cat1')).rejects.toMatchObject({
      code: ErrorCode.CATEGORY_TOO_MANY_ZONES,
    });
  });

  it('lanza si la categoría no tiene ninguna zona', async () => {
    const { sut } = buildSut({
      category: { id: 'cat1', tournamentId: 't1', zonesCount: 1 },
      zones: [],
      registrations: [],
      existing: [],
    });
    await expect(sut.execute('cat1')).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_FAILED,
    });
  });

  it('distribuye round-robin los equipos aprobados nuevos', async () => {
    const { sut, prisma } = buildSut({
      category: { id: 'cat1', tournamentId: 't1', zonesCount: 2 },
      zones: [
        { id: 'zA', name: 'A' },
        { id: 'zB', name: 'B' },
      ],
      registrations: [
        { teamId: 't1' },
        { teamId: 't2' },
        { teamId: 't3' },
        { teamId: 't4' },
      ],
      existing: [],
    });

    const out = await sut.execute('cat1');

    expect(prisma.teamZone.createMany).toHaveBeenCalledTimes(1);
    const data = (prisma.teamZone.createMany as jest.Mock).mock.calls[0][0]
      .data as Array<{ zoneId: string; teamId: string }>;
    // round-robin: t1→A, t2→B, t3→A, t4→B
    expect(data).toEqual([
      { zoneId: 'zA', teamId: 't1' },
      { zoneId: 'zB', teamId: 't2' },
      { zoneId: 'zA', teamId: 't3' },
      { zoneId: 'zB', teamId: 't4' },
    ]);
    expect(out.totalTeams).toBe(4);
    expect(out.newAssignments).toHaveLength(4);
    expect(out.assignmentsByZone['zA']).toEqual(['t1', 't3']);
    expect(out.assignmentsByZone['zB']).toEqual(['t2', 't4']);
  });

  it('idempotente: equipos ya asignados no se vuelven a asignar', async () => {
    const { sut, prisma } = buildSut({
      category: { id: 'cat1', tournamentId: 't1', zonesCount: 2 },
      zones: [
        { id: 'zA', name: 'A' },
        { id: 'zB', name: 'B' },
      ],
      registrations: [{ teamId: 't1' }, { teamId: 't2' }],
      existing: [{ teamId: 't1', zoneId: 'zA' }],
    });

    const out = await sut.execute('cat1');

    expect(out.newAssignments).toEqual([{ zoneId: 'zA', teamId: 't2' }]);
    expect(prisma.teamZone.createMany).toHaveBeenCalledTimes(1);
  });
});
