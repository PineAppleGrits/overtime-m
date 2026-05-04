import { SportRulesRegistry } from '../../../common/sport-rules';
import {
  IMatchStaffRepository,
  MatchStaffRow,
} from '../ports/match-staff-repository.port';
import { ValidateMinStaffUseCase } from './validate-min-staff.use-case';

const makeMatchStaffRepo = (
  rows: Partial<MatchStaffRow>[],
): jest.Mocked<IMatchStaffRepository> =>
  ({
    findByMatch: jest.fn().mockResolvedValue(
      rows.map((r, i) => ({
        id: `ms-${i}`,
        matchId: 'm-1',
        staffId: `s-${i}`,
        role: 'referee',
        status: 'assigned',
        assignedBy: null,
        assignedAt: null,
        createdAt: new Date(),
        ...r,
      })),
    ),
  }) as unknown as jest.Mocked<IMatchStaffRepository>;

describe('ValidateMinStaffUseCase (RN-049)', () => {
  const registry = new SportRulesRegistry();

  it('valid=true cuando hay 1 árbitro y 1 oficial de mesa (mínimo basket)', async () => {
    const repo = makeMatchStaffRepo([
      { role: 'referee', status: 'assigned' },
      { role: 'table_official', status: 'assigned' },
    ]);
    const uc = new ValidateMinStaffUseCase(repo, registry);
    const out = await uc.execute({
      matchId: 'm-1',
      sportCode: 'BASKETBALL',
      modality: '5v5',
    });
    expect(out.valid).toBe(true);
    expect(out.missing).toEqual([]);
  });

  it('valid=false cuando falta el oficial de mesa', async () => {
    const repo = makeMatchStaffRepo([
      { role: 'referee', status: 'assigned' },
    ]);
    const uc = new ValidateMinStaffUseCase(repo, registry);
    const out = await uc.execute({
      matchId: 'm-1',
      sportCode: 'BASKETBALL',
      modality: '5v5',
    });
    expect(out.valid).toBe(false);
    expect(out.missing).toContainEqual(
      expect.objectContaining({ role: 'table_official', missing: 1 }),
    );
  });

  it('ignora staff con status="rejected"', async () => {
    const repo = makeMatchStaffRepo([
      { role: 'referee', status: 'rejected' },
      { role: 'table_official', status: 'assigned' },
    ]);
    const uc = new ValidateMinStaffUseCase(repo, registry);
    const out = await uc.execute({
      matchId: 'm-1',
      sportCode: 'BASKETBALL',
      modality: '5v5',
    });
    expect(out.valid).toBe(false);
    expect(out.missing.find((m) => m.role === 'referee')).toBeDefined();
  });

  it('cuenta status=applied como activo', async () => {
    const repo = makeMatchStaffRepo([
      { role: 'referee', status: 'applied' },
      { role: 'table_official', status: 'applied' },
    ]);
    const uc = new ValidateMinStaffUseCase(repo, registry);
    const out = await uc.execute({
      matchId: 'm-1',
      sportCode: 'BASKETBALL',
      modality: '5v5',
    });
    expect(out.valid).toBe(true);
  });
});
