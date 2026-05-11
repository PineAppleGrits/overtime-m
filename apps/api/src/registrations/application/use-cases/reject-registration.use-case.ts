import { Injectable } from '@nestjs/common';
import { RegistrationsService } from '../services/registrations.service';

@Injectable()
export class RejectRegistrationUseCase {
  constructor(private readonly registrations: RegistrationsService) {}

  async execute(id: string, userId: string, rejectionReason?: string) {
    return this.registrations.reject(id, userId, rejectionReason);
  }
}
