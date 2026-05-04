import { Friendly, FriendlyState } from './friendly.entity';

const baseState: FriendlyState = {
  id: 'f-1',
  sportId: 'sport-1',
  modality: '5v5',
  homeTeamId: 'team-home',
  awayTeamId: 'team-away',
  proposedDate: new Date('2026-06-01T20:00:00Z'),
  venueId: null,
  status: 'REQUESTED',
  notes: null,
  confirmationDeadline: null,
  resultingMatchId: null,
  observedForCategorization: false,
  createdByProfileId: 'p-1',
  generatedByProfileId: null,
  generatedAt: null,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: new Date('2026-05-01T10:00:00Z'),
  updatedAt: new Date('2026-05-01T10:00:00Z'),
};

describe('Friendly entity', () => {
  it('involvesTeam detecta home y away', () => {
    const e = Friendly.fromState(baseState);
    expect(e.involvesTeam('team-home')).toBe(true);
    expect(e.involvesTeam('team-away')).toBe(true);
    expect(e.involvesTeam('team-other')).toBe(false);
  });

  it('canCancel acepta REQUESTED, rechaza PLAYED', () => {
    const requested = Friendly.fromState({ ...baseState, status: 'REQUESTED' });
    const played = Friendly.fromState({ ...baseState, status: 'PLAYED' });
    expect(requested.canCancel()).toBe(true);
    expect(played.canCancel()).toBe(false);
  });

  it('canCancel rechaza CONFIRMED si playedMatchExists=true', () => {
    const e = Friendly.fromState({ ...baseState, status: 'CONFIRMED' });
    expect(e.canCancel(false)).toBe(true);
    expect(e.canCancel(true)).toBe(false);
  });

  it('isPendingDeposit es true para GENERATED y PENDING_CONFIRMATION', () => {
    const generated = Friendly.fromState({ ...baseState, status: 'GENERATED' });
    const pending = Friendly.fromState({
      ...baseState,
      status: 'PENDING_CONFIRMATION',
    });
    const requested = Friendly.fromState({
      ...baseState,
      status: 'REQUESTED',
    });
    expect(generated.isPendingDeposit()).toBe(true);
    expect(pending.isPendingDeposit()).toBe(true);
    expect(requested.isPendingDeposit()).toBe(false);
  });

  it('isDepositWindowExpired evalúa correctamente la deadline', () => {
    const now = new Date('2026-05-02T10:00:00Z');
    const expired = Friendly.fromState({
      ...baseState,
      status: 'GENERATED',
      confirmationDeadline: new Date('2026-05-02T09:00:00Z'),
    });
    const valid = Friendly.fromState({
      ...baseState,
      status: 'GENERATED',
      confirmationDeadline: new Date('2026-05-02T11:00:00Z'),
    });
    expect(expired.isDepositWindowExpired(now)).toBe(true);
    expect(valid.isDepositWindowExpired(now)).toBe(false);
  });

  it('toState devuelve un snapshot copiado (no la referencia)', () => {
    const e = Friendly.fromState(baseState);
    const snap = e.toState();
    expect(snap).toEqual(baseState);
    expect(snap).not.toBe(baseState);
  });
});
