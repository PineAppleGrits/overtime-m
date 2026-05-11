import { Injectable } from '@nestjs/common';
import { RegistrationsService } from '../../registrations.service';

@Injectable()
export class GetRegistrationRosterUseCase {
  constructor(private readonly legacy: RegistrationsService) {}

  async execute(id: string) {
    return this.legacy.findRoster(id);
  }
}
