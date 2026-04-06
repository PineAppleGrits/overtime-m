import {
  addPlayerSchema,
  createTeamSchema,
  updateTeamSchema,
} from '../../../../packages/shared/src/teams/contracts';
import { paginationSchema } from '../../../../packages/shared/src/common/contracts';

describe('shared team contracts', () => {
  const validUuid = '5b32c0ab-1f55-4d7d-b63e-d4f0d1d6c8b9';
  const anotherUuid = '95db7f34-2a2e-46b5-829b-d7f4eb9b5d55';

  it('normalizes optional team fields when empty strings are submitted', () => {
    const result = createTeamSchema.parse({
      name: 'Team Overtime',
      sportId: validUuid,
      logoUrl: '',
      captainId: '',
      franchiseId: anotherUuid,
    });

    expect(result.logoUrl).toBeUndefined();
    expect(result.captainId).toBeUndefined();
    expect(result.franchiseId).toBe(anotherUuid);
  });

  it('coerces pagination query params and applies defaults', () => {
    const result = paginationSchema.parse({
      page: '2',
      limit: '5',
    });

    expect(result).toEqual({
      page: 2,
      limit: 5,
      sortOrder: 'desc',
    });
  });

  it('requires UUIDs in add player payloads', () => {
    expect(() =>
      addPlayerSchema.parse({
        profileId: 'not-a-uuid',
      }),
    ).toThrow();
  });

  it('allows partial team updates while preserving shared validation rules', () => {
    const result = updateTeamSchema.parse({
      logoUrl: '',
      captainId: validUuid,
    });

    expect(result.logoUrl).toBeUndefined();
    expect(result.captainId).toBe(validUuid);
  });
});
