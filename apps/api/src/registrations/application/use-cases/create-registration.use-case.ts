import { Injectable } from '@nestjs/common';
import type { CreateRegistrationSchemaDto } from '@overtime-mono/shared';
import { RegistrationsService } from '../services/registrations.service';

@Injectable()
export class CreateRegistrationUseCase {
  constructor(private readonly registrations: RegistrationsService) {}

  async execute(createRegistrationDto: CreateRegistrationSchemaDto, userId: string) {
    return this.registrations.create(createRegistrationDto, userId);
  }
}
