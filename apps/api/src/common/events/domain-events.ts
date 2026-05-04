/**
 * Namespace central de eventos de dominio.
 *
 * Decisión PR0: bus de eventos con `@nestjs/event-emitter`. Los use-cases
 * emiten eventos de este namespace; otros módulos (notificaciones, auditoría,
 * jobs derivados) los consumen sin acoplamiento directo.
 *
 * Convención de naming:
 * - `<aggregate>.<past-tense-verb>` → ej `registration.approved`, `friendly.confirmed`.
 * - Eventos en pasado, indican que algo YA pasó.
 *
 * Cada feature de Olas 1-3 puede sumar sus eventos extendiendo este enum y
 * agregando el payload tipado en `DomainEventPayloads`.
 */
export const DomainEvent = {
  // Registrations
  REGISTRATION_CREATED: 'registration.created',
  REGISTRATION_APPROVED: 'registration.approved',
  REGISTRATION_REJECTED: 'registration.rejected',
  REGISTRATION_INSURANCE_PAID: 'registration.insurance.paid',

  // Teams
  TEAM_CREATED: 'team.created',
  TEAM_CATEGORIZED: 'team.categorized',
  TEAM_PROMOTED: 'team.promoted',
  TEAM_RELEGATED: 'team.relegated',

  // Tournaments / categories
  TOURNAMENT_STATUS_CHANGED: 'tournament.status.changed',
  CATEGORY_REGULAR_PHASE_COMPLETED: 'category.regularPhase.completed',
  CATEGORY_PLAYOFFS_STARTED: 'category.playoffs.started',
  CATEGORY_FINISHED: 'category.finished',

  // Matches
  MATCH_SCHEDULED: 'match.scheduled',
  MATCH_RESCHEDULED: 'match.rescheduled',
  MATCH_CANCELLED: 'match.cancelled',
  MATCH_STARTED: 'match.started',
  MATCH_FINISHED: 'match.finished',
  MATCH_SUSPENDED: 'match.suspended',
  MATCH_STAFF_ASSIGNED: 'match.staff.assigned',
  MATCH_PHOTO_FOLDER_CREATED: 'match.photoFolder.created', // RN-051

  // Friendlies
  FRIENDLY_REQUESTED: 'friendly.requested',
  FRIENDLY_GENERATED: 'friendly.generated',
  FRIENDLY_DEPOSIT_PAID: 'friendly.deposit.paid',
  FRIENDLY_CONFIRMED: 'friendly.confirmed',
  FRIENDLY_EXPIRED: 'friendly.expired',
  FRIENDLY_CANCELLED: 'friendly.cancelled',
  FRIENDLY_PLAYED: 'friendly.played',

  // Debts / payments
  DEBT_CREATED: 'debt.created',
  DEBT_FULLY_PAID: 'debt.fully.paid',
  DEBT_PARTIALLY_PAID: 'debt.partially.paid',
  DEBT_CANCELLED: 'debt.cancelled',
  DEBT_OVERDUE_DETECTED: 'debt.overdue.detected',
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_APPROVED: 'payment.approved',
  PAYMENT_REJECTED: 'payment.rejected',

  // Sanctions
  SANCTION_CREATED: 'sanction.created',
  SANCTION_RESOLVED: 'sanction.resolved',
  AJC_APPLIED: 'sanction.ajc.applied', // RN-030 — habilitación anticipada por AJC aplicada
} as const;

export type DomainEventName = (typeof DomainEvent)[keyof typeof DomainEvent];

/**
 * Payloads tipados por evento. Cada feature define su payload acá.
 *
 * Para emitir tipado:
 * ```ts
 * eventEmitter.emit(DomainEvent.REGISTRATION_APPROVED, {
 *   registrationId, teamId, tournamentId, approvedBy,
 * } satisfies DomainEventPayloads['registration.approved']);
 * ```
 */
export interface DomainEventPayloads {
  // Registrations
  'registration.created': {
    registrationId: string;
    teamId: string;
    tournamentId: string;
    categoryId: string;
    requestedBy: string;
  };
  'registration.approved': {
    registrationId: string;
    teamId: string;
    tournamentId: string;
    approvedBy: string;
  };
  'registration.rejected': {
    registrationId: string;
    teamId: string;
    tournamentId: string;
    rejectedBy: string;
    reason?: string;
  };
  'registration.insurance.paid': {
    registrationId: string;
    teamId: string;
    profileId: string;
    debtId: string;
  };

  // Teams
  'team.created': { teamId: string; createdBy: string };
  'team.categorized': {
    teamId: string;
    categoryLevelIds: string[];
    grantedBy: string;
  };
  'team.promoted': {
    teamId: string;
    fromLevelId: string;
    toLevelId: string;
  };
  'team.relegated': {
    teamId: string;
    fromLevelId: string;
    toLevelId: string;
  };

  // Tournaments / categories
  'tournament.status.changed': {
    tournamentId: string;
    fromStatus: string;
    toStatus: string;
  };
  'category.regularPhase.completed': { categoryId: string };
  'category.playoffs.started': { categoryId: string };
  'category.finished': {
    categoryId: string;
    championTeamId?: string;
    runnerUpTeamId?: string;
    lastTeamId?: string;
  };

  // Matches
  'match.scheduled': { matchId: string };
  'match.rescheduled': { matchId: string; previousDate: Date };
  'match.cancelled': { matchId: string; reason?: string };
  'match.started': { matchId: string };
  'match.finished': {
    matchId: string;
    homeScore: number;
    awayScore: number;
    homeTeamId: string;
    awayTeamId: string;
  };
  'match.suspended': { matchId: string; reason?: string };
  'match.staff.assigned': {
    matchId: string;
    staffId: string;
    role: string;
  };
  'match.photoFolder.created': {
    matchId: string;
    folderId: string;
    folderUrl: string;
  };

  // Friendlies
  'friendly.requested': { friendlyId: string; createdBy: string };
  'friendly.generated': { friendlyId: string; generatedBy: string };
  'friendly.deposit.paid': {
    friendlyId: string;
    teamId: string;
    debtId: string;
  };
  'friendly.confirmed': { friendlyId: string; resultingMatchId: string };
  'friendly.expired': { friendlyId: string };
  'friendly.cancelled': { friendlyId: string; reason?: string };
  'friendly.played': {
    friendlyId: string;
    matchId: string;
    homeTeamId: string;
    awayTeamId: string;
  };

  // Debts
  'debt.created': {
    debtId: string;
    type: string;
    amount: number;
    teamId?: string;
    profileId?: string;
  };
  'debt.fully.paid': { debtId: string };
  'debt.partially.paid': {
    debtId: string;
    paidAmount: number;
    remainingBalance: number;
  };
  'debt.cancelled': { debtId: string; reason?: string };
  'debt.overdue.detected': { debtId: string };

  // Payments
  'payment.created': { paymentId: string; debtId?: string };
  'payment.approved': {
    paymentId: string;
    debtId?: string;
    approvedBy: string;
    method: string;
  };
  'payment.rejected': { paymentId: string; reason?: string };

  // Sanctions
  'sanction.created': { sanctionId: string; targetType: string };
  'sanction.resolved': { sanctionId: string; resolvedBy: string };
  'sanction.ajc.applied': {
    sanctionId: string;
    profileId: string;
    debtId: string;
    refereeSalary: number;
    fechasFreed: number;
    amount: number;
    appliedBy: string;
  };
}
