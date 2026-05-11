import { Injectable } from '@nestjs/common';
import { RegistrationsService } from '../../registrations.service';

@Injectable()
export class RejectRegistrationUseCase {
  constructor(private readonly legacy: RegistrationsService) {}

  async execute(id: string, userId: string, rejectionReason?: string) {
    return this.legacy.reject(id, userId, rejectionReason);
  }
}
