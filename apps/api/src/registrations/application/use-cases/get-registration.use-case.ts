import { Injectable } from '@nestjs/common';
import { RegistrationsService } from '../../registrations.service';

@Injectable()
export class GetRegistrationUseCase {
  constructor(private readonly legacy: RegistrationsService) {}

  async execute(id: string) {
    return this.legacy.findOne(id);
  }
}
