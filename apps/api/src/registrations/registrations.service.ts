import { Injectable } from '@nestjs/common';
import type {
  AddRegistrationRosterEntryDto,
  CreateRegistrationSchemaDto,
  PaginationDto,
} from '@overtime-mono/shared';
import { RegistrationsService as ApplicationRegistrationsService } from './application/services/registrations.service';

@Injectable()
export class RegistrationsService {
  constructor(private readonly service: ApplicationRegistrationsService) {}

  async create(
    createRegistrationDto: CreateRegistrationSchemaDto,
    requestedBy: string,
  ) {
    return this.service.create(createRegistrationDto, requestedBy);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: {
      tournamentId?: string;
      teamId?: string;
      categoryId?: string;
      status?: string;
    },
  ) {
    return this.service.findAll(paginationDto, filters);
  }

  async findOne(id: string) {
    return this.service.findOne(id);
  }

  async findRoster(id: string) {
    return this.service.findRoster(id);
  }

  async addRosterEntry(
    id: string,
    addRosterEntryDto: AddRegistrationRosterEntryDto,
    addedBy: string,
  ) {
    return this.service.addRosterEntry(id, addRosterEntryDto, addedBy);
  }

  async approve(id: string, approvedBy: string) {
    return this.service.approve(id, approvedBy);
  }

  async reject(id: string, approvedBy: string, rejectionReason?: string) {
    return this.service.reject(id, approvedBy, rejectionReason);
  }

  async remove(id: string) {
    return this.service.remove(id);
  }
}
