import { computeProfileActiveStatus } from './profile-status.rules';

describe('computeProfileActiveStatus (RN-037)', () => {
  it('isActive=false con 0 equipos', () => {
    expect(computeProfileActiveStatus(0)).toEqual({
      isActive: false,
      teamCount: 0,
    });
  });
  it('isActive=true con 1+ equipos', () => {
    expect(computeProfileActiveStatus(1).isActive).toBe(true);
    expect(computeProfileActiveStatus(5).isActive).toBe(true);
  });
});
