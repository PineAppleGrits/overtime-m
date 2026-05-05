import { Sanction, SanctionProps } from './sanction.entity';

const baseProps = (overrides: Partial<SanctionProps> = {}): SanctionProps => ({
  id: 's1',
  targetType: 'PROFILE',
  targetProfileId: 'p1',
  targetTeamId: null,
  kind: 'DISCIPLINARY',
  status: 'ACTIVE',
  reason: 'falta',
  notes: null,
  attachmentUrls: [],
  matchId: null,
  tournamentId: null,
  categoryId: null,
  startsAt: null,
  endsAt: null,
  amount: null,
  currency: 'ARS',
  createdByProfileId: 'admin',
  resolvedByProfileId: null,
  resolvedAt: null,
  resolutionNotes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('Sanction entity', () => {
  it('isActive() respeta status + ventana temporal', () => {
    const s = new Sanction(baseProps());
    expect(s.isActive(new Date('2026-05-01'))).toBe(true);

    const future = new Sanction(
      baseProps({ startsAt: new Date('2026-12-01') }),
    );
    expect(future.isActive(new Date('2026-05-01'))).toBe(false);

    const past = new Sanction(baseProps({ endsAt: new Date('2026-01-15') }));
    expect(past.isActive(new Date('2026-05-01'))).toBe(false);

    const cancelled = new Sanction(baseProps({ status: 'CANCELLED' }));
    expect(cancelled.isActive(new Date('2026-05-01'))).toBe(false);
  });

  it('initFechas() embebe el contador en notes', () => {
    const s = new Sanction(baseProps());
    s.initFechas(3);
    expect(s.readFechas()).toEqual({ totalFechas: 3, fechasCumplidas: 0 });
  });

  it('addFechas() suma y auto-resuelve al llegar al total', () => {
    const s = new Sanction(baseProps());
    s.initFechas(2);
    s.addFechas(1);
    expect(s.readFechas()).toEqual({ totalFechas: 2, fechasCumplidas: 1 });
    expect(s.status).toBe('ACTIVE');

    const result = s.addFechas(1);
    expect(result.autoResolved).toBe(true);
    expect(s.status).toBe('RESOLVED');
  });

  it('markResolved() lanza si ya está resuelta', () => {
    const s = new Sanction(baseProps({ status: 'RESOLVED' }));
    expect(() => s.markResolved()).toThrow();
  });

  it('markCancelled() permitido sólo desde ACTIVE', () => {
    const s = new Sanction(baseProps());
    s.markCancelled({ cancelledByProfileId: 'admin' });
    expect(s.status).toBe('CANCELLED');
  });

  it('appendAjcStamp() agrega rastro AJC en notes sin perder el marcador de fechas', () => {
    const s = new Sanction(baseProps());
    s.initFechas(3);
    s.appendAjcStamp('[AJC 2026-05-01] amount=$10000');
    expect(s.notes).toContain('[FECHAS] total=3 cumplidas=0');
    expect(s.notes).toContain('[AJC 2026-05-01]');
  });
});
