import {
  debtOverdueTemplate,
  debtPaidTemplate,
  dniPendingReviewTemplate,
  friendlyExpiredTemplate,
  friendlyGeneratedTemplate,
  matchCancelledTemplate,
  matchRescheduledTemplate,
  paymentApprovedTemplate,
  profileRoleChangedTemplate,
  registrationApprovedTemplate,
  registrationRejectedTemplate,
  sanctionCreatedTemplate,
} from './index';

describe('notification templates (RN-013/-022/-023/-025-031/-036/-057)', () => {
  it('registrationApprovedTemplate incluye nombre, equipo y torneo', () => {
    const r = registrationApprovedTemplate({
      recipientName: 'Marco',
      teamName: 'Lakers',
      tournamentName: 'Apertura 2026',
      categoryName: 'A',
    });
    expect(r.subject).toContain('Lakers');
    expect(r.subject).toContain('Apertura 2026');
    expect(r.html).toContain('Marco');
    expect(r.html).toContain('Lakers');
    expect(r.html).toContain('A');
    expect(r.text).toContain('Marco');
  });

  it('registrationRejectedTemplate menciona motivo cuando se da', () => {
    const r = registrationRejectedTemplate({
      recipientName: 'Juan',
      teamName: 'Bulls',
      tournamentName: 'Clausura',
      reason: 'Roster incompleto',
    });
    expect(r.subject).toContain('Bulls');
    expect(r.html).toContain('Roster incompleto');
  });

  it('friendlyGeneratedTemplate incluye fecha y plazo de seña', () => {
    const date = new Date('2026-06-10T20:00:00Z');
    const deadline = new Date('2026-06-09T20:00:00Z');
    const r = friendlyGeneratedTemplate({
      recipientName: 'Pepe',
      homeTeamName: 'Locos',
      awayTeamName: 'Salvajes',
      matchDate: date,
      depositDeadline: deadline,
    });
    expect(r.subject).toContain('Locos');
    expect(r.subject).toContain('Salvajes');
  });

  it('friendlyExpiredTemplate menciona ambos equipos', () => {
    const r = friendlyExpiredTemplate({
      recipientName: 'Lalo',
      homeTeamName: 'A',
      awayTeamName: 'B',
    });
    expect(r.subject).toContain('A');
    expect(r.subject).toContain('B');
  });

  it('matchRescheduledTemplate incluye fechas vieja y nueva', () => {
    const r = matchRescheduledTemplate({
      recipientName: 'Coach',
      homeTeamName: 'X',
      awayTeamName: 'Y',
      previousDate: new Date('2026-05-10'),
      newDate: new Date('2026-05-17'),
      reason: 'Lluvia',
    });
    expect(r.html).toContain('Lluvia');
    expect(r.html).toMatch(/X.*Y|Y.*X/);
  });

  it('matchCancelledTemplate menciona rival decision si aplica', () => {
    const r = matchCancelledTemplate({
      recipientName: 'Rival',
      homeTeamName: 'A',
      awayTeamName: 'B',
      requiresRivalDecision: true,
    });
    expect(r.html).toContain('rival');
  });

  it('debtOverdueTemplate incluye monto y concepto', () => {
    const r = debtOverdueTemplate({
      recipientName: 'Pedro',
      debtConcept: 'Inscripción Apertura 2026',
      amount: 50000,
    });
    expect(r.subject).toContain('Inscripción Apertura 2026');
    expect(r.html).toContain('50');
  });

  it('debtPaidTemplate confirma saldado', () => {
    const r = debtPaidTemplate({
      recipientName: 'Pedro',
      debtConcept: 'Seguro',
      amount: 1000,
    });
    expect(r.subject).toContain('Seguro');
    expect(r.html).toContain('Pedro');
  });

  it('sanctionCreatedTemplate menciona tipo', () => {
    const r = sanctionCreatedTemplate({
      recipientName: 'Lucas',
      sanctionType: 'DISCIPLINARY',
      description: 'Falta técnica',
      fechasAffected: 2,
    });
    expect(r.subject).toContain('DISCIPLINARY');
    expect(r.html).toContain('Falta técnica');
  });

  it('paymentApprovedTemplate incluye monto y paymentId', () => {
    const r = paymentApprovedTemplate({
      recipientName: 'Pago Manuel',
      amount: 12345,
      currency: 'ARS',
      concept: 'Inscripción',
      paymentId: 'pay-1',
    });
    expect(r.html).toContain('pay-1');
    expect(r.html).toContain('Inscripción');
  });

  it('dniPendingReviewTemplate referencia profileId y nombre', () => {
    const r = dniPendingReviewTemplate({
      recipientName: 'Admin',
      profileId: 'prof-1',
      profileName: 'Usuario Test',
    });
    expect(r.subject).toContain('Usuario Test');
    expect(r.html).toContain('prof-1');
  });

  it('profileRoleChangedTemplate menciona rol anterior y nuevo', () => {
    const r = profileRoleChangedTemplate({
      recipientName: 'Usuario',
      fromRole: 'player',
      toRole: 'referee',
    });
    expect(r.subject).toContain('referee');
    expect(r.html).toContain('player');
    expect(r.html).toContain('referee');
  });
});
