import { Injectable } from '@nestjs/common';
import { RegistrationsService } from '../../registrations.service';

@Injectable()
export class RemoveRegistrationUseCase {
  constructor(private readonly legacy: RegistrationsService) {}

  async execute(id: string) {
    return this.legacy.remove(id);
  }
}
