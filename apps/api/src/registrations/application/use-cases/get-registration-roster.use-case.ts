import { Injectable } from '@nestjs/common';
import { RegistrationsService } from '../services/registrations.service';

@Injectable()
export class GetRegistrationRosterUseCase {
  constructor(private readonly registrations: RegistrationsService) {}

  async execute(id: string) {
    return this.registrations.findRoster(id);
  }
}
