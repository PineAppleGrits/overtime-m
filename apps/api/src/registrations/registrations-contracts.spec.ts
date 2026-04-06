import {
  addRegistrationRosterEntrySchema,
  createRegistrationSchema,
} from '../../../../packages/shared/src/registrations/contracts';

describe('shared registration contracts', () => {
  const makeUuid = (index: number): string =>
    `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;

  const makeInitialRoster = (length: number) =>
    Array.from({ length }, (_, index) => ({
      documentNumber: `${40_000_000 + index}`,
      name: `Jugador ${index + 1}`,
    }));

  it('accepts an initial roster with 8 unique players by dni and name', () => {
    const roster = makeInitialRoster(8);

    const result = createRegistrationSchema.parse({
      teamId: makeUuid(100),
      tournamentId: makeUuid(200),
      categoryId: makeUuid(300),
      initialRoster: roster,
    });

    expect(result.initialRoster).toHaveLength(8);
  });

  it('rejects an initial roster with fewer than 8 players', () => {
    const roster = makeInitialRoster(7);

    expect(() =>
      createRegistrationSchema.parse({
        teamId: makeUuid(100),
        tournamentId: makeUuid(200),
        categoryId: makeUuid(300),
        initialRoster: roster,
      }),
    ).toThrow();
  });

  it('rejects duplicated players in the initial roster', () => {
    expect(() =>
      createRegistrationSchema.parse({
        teamId: makeUuid(100),
        tournamentId: makeUuid(200),
        categoryId: makeUuid(300),
        initialRoster: [
          { documentNumber: '40000001', name: 'Jugador 1' },
          { documentNumber: '40000001', name: 'Jugador 1 Repetido' },
          { documentNumber: '40000002', name: 'Jugador 2' },
          { documentNumber: '40000003', name: 'Jugador 3' },
          { documentNumber: '40000004', name: 'Jugador 4' },
          { documentNumber: '40000005', name: 'Jugador 5' },
          { documentNumber: '40000006', name: 'Jugador 6' },
          { documentNumber: '40000007', name: 'Jugador 7' },
        ],
      }),
    ).toThrow();
  });

  it('accepts roster additions by dni and name', () => {
    const result = addRegistrationRosterEntrySchema.parse({
      documentNumber: '40123456',
      name: 'Jugador Stub',
    });

    expect(result.documentNumber).toBe('40123456');
  });

  it('requires a valid payload for roster additions', () => {
    expect(() =>
      addRegistrationRosterEntrySchema.parse({
        name: 'Jugador Sin DNI',
      }),
    ).toThrow();
  });
});
