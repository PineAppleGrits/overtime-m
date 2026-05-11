import { Injectable } from '@nestjs/common';
import type { CreateRegistrationSchemaDto } from '@overtime-mono/shared';
import { RegistrationsService } from '../../registrations.service';

@Injectable()
export class CreateRegistrationUseCase {
  constructor(private readonly legacy: RegistrationsService) {}

  async execute(createRegistrationDto: CreateRegistrationSchemaDto, userId: string) {
    return this.legacy.create(createRegistrationDto, userId);
  }
}
