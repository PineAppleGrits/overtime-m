import { createTournamentSchema } from '../../../../packages/shared/src/tournaments/contracts';

describe('shared tournament contracts', () => {
  const validUuid = '5b32c0ab-1f55-4d7d-b63e-d4f0d1d6c8b9';

  it('accepts team operation windows when open date is before close date', () => {
    const result = createTournamentSchema.parse({
      name: 'Clausura 2026',
      sportId: validUuid,
      teamOperationsOpenAt: '2026-06-01T09:00:00.000Z',
      teamOperationsCloseAt: '2026-06-30T18:00:00.000Z',
    });

    expect(result.teamOperationsOpenAt).toBe('2026-06-01T09:00:00.000Z');
  });

  it('rejects team operation windows when open date is after close date', () => {
    expect(() =>
      createTournamentSchema.parse({
        name: 'Clausura 2026',
        sportId: validUuid,
        teamOperationsOpenAt: '2026-06-30T18:00:00.000Z',
        teamOperationsCloseAt: '2026-06-01T09:00:00.000Z',
      }),
    ).toThrow();
  });
});
