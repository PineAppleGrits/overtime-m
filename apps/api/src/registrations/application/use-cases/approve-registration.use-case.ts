import { Injectable } from '@nestjs/common';
import { RegistrationsService } from '../../registrations.service';

@Injectable()
export class ApproveRegistrationUseCase {
  constructor(private readonly legacy: RegistrationsService) {}

  async execute(id: string, userId: string) {
    return this.legacy.approve(id, userId);
  }
}
