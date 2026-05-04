import { Staff, StaffState } from './staff.entity';

const baseState = (override: Partial<StaffState> = {}): StaffState => ({
  id: 's-1',
  profileId: null,
  type: 'referee',
  firstName: 'Juan',
  lastName: 'Perez',
  phone: null,
  email: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...override,
});

describe('Staff entity', () => {
  it('canBeAssignedToMatch — true cuando role coincide', () => {
    const s = Staff.fromState(baseState({ type: 'referee' }));
    expect(s.canBeAssignedToMatch('referee')).toBe(true);
    expect(s.canBeAssignedToMatch('table_official')).toBe(false);
  });

  it('canBeAssignedToMatch — false si está borrado o inactivo', () => {
    expect(
      Staff.fromState(baseState({ deletedAt: new Date() })).canBeAssignedToMatch(
        'referee',
      ),
    ).toBe(false);
    expect(
      Staff.fromState(baseState({ isActive: false })).canBeAssignedToMatch(
        'referee',
      ),
    ).toBe(false);
  });

  it('computeAjcAmount delega en computeAjcFee', () => {
    const s = Staff.fromState(baseState({ type: 'referee' }));
    expect(s.computeAjcAmount(5000, 3)).toBe(15000);
  });
});
