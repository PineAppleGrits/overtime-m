export const REGISTRATION_EVENTS_PORT = Symbol('REGISTRATION_EVENTS_PORT');

export interface RegistrationEventsPort {
  emitApproved(payload: {
    registrationId: string;
    teamId: string;
    tournamentId: string;
    approvedBy: string;
  }): void;
  emitRejected(payload: {
    registrationId: string;
    teamId: string;
    tournamentId: string;
    rejectedBy: string;
    reason?: string;
  }): void;
}

