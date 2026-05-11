import { Injectable } from '@nestjs/common';
import type { AddRegistrationRosterEntryDto } from '@overtime-mono/shared';
import { RegistrationsService } from '../../registrations.service';

@Injectable()
export class AddRegistrationRosterEntryUseCase {
  constructor(private readonly legacy: RegistrationsService) {}

  async execute(
    id: string,
    addRosterEntryDto: AddRegistrationRosterEntryDto,
    userId: string,
  ) {
    return this.legacy.addRosterEntry(id, addRosterEntryDto, userId);
  }
}
