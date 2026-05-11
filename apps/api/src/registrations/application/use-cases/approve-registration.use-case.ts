import { Injectable } from '@nestjs/common';
import { RegistrationsService } from '../services/registrations.service';

@Injectable()
export class ApproveRegistrationUseCase {
  constructor(private readonly registrations: RegistrationsService) {}

  async execute(id: string, userId: string) {
    return this.registrations.approve(id, userId);
  }
}
