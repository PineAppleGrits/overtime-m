import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, type DomainEventPayloads } from '../../../common/events';
import type { RegistrationEventsPort } from '../../application/ports/registration-events.port';

@Injectable()
export class RegistrationEventsAdapter implements RegistrationEventsPort {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitApproved(payload: {
    registrationId: string;
    teamId: string;
    tournamentId: string;
    approvedBy: string;
  }): void {
    this.eventEmitter.emit(
      DomainEvent.REGISTRATION_APPROVED,
      payload satisfies DomainEventPayloads['registration.approved'],
    );
  }

  emitRejected(payload: {
    registrationId: string;
    teamId: string;
    tournamentId: string;
    rejectedBy: string;
    reason?: string;
  }): void {
    this.eventEmitter.emit(
      DomainEvent.REGISTRATION_REJECTED,
      payload satisfies DomainEventPayloads['registration.rejected'],
    );
  }
}

