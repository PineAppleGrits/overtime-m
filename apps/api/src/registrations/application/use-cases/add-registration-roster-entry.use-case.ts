import { Injectable } from '@nestjs/common';
import type { AddRegistrationRosterEntryDto } from '@overtime-mono/shared';
import { RegistrationsService } from '../services/registrations.service';

@Injectable()
export class AddRegistrationRosterEntryUseCase {
  constructor(private readonly registrations: RegistrationsService) {}

  async execute(
    id: string,
    addRosterEntryDto: AddRegistrationRosterEntryDto,
    userId: string,
  ) {
    return this.registrations.addRosterEntry(id, addRosterEntryDto, userId);
  }
}
