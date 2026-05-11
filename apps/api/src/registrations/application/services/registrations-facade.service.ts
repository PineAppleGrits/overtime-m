import { Injectable } from '@nestjs/common';
import type {
  AddRegistrationRosterEntryDto,
  CreateRegistrationSchemaDto,
  PaginationDto,
} from '@overtime-mono/shared';
import { AddRegistrationRosterEntryUseCase } from '../use-cases/add-registration-roster-entry.use-case';
import { ApproveRegistrationUseCase } from '../use-cases/approve-registration.use-case';
import { CreateRegistrationUseCase } from '../use-cases/create-registration.use-case';
import { GetRegistrationUseCase } from '../use-cases/get-registration.use-case';
import { GetRegistrationRosterUseCase } from '../use-cases/get-registration-roster.use-case';
import { ListRegistrationsUseCase } from '../use-cases/list-registrations.use-case';
import { RejectRegistrationUseCase } from '../use-cases/reject-registration.use-case';
import { RemoveRegistrationUseCase } from '../use-cases/remove-registration.use-case';

@Injectable()
export class RegistrationsFacadeService {
  constructor(
    private readonly createRegistrationUseCase: CreateRegistrationUseCase,
    private readonly listRegistrationsUseCase: ListRegistrationsUseCase,
    private readonly getRegistrationUseCase: GetRegistrationUseCase,
    private readonly getRegistrationRosterUseCase: GetRegistrationRosterUseCase,
    private readonly addRegistrationRosterEntryUseCase: AddRegistrationRosterEntryUseCase,
    private readonly approveRegistrationUseCase: ApproveRegistrationUseCase,
    private readonly rejectRegistrationUseCase: RejectRegistrationUseCase,
    private readonly removeRegistrationUseCase: RemoveRegistrationUseCase,
  ) {}

  async create(createRegistrationDto: CreateRegistrationSchemaDto, userId: string) {
    return this.createRegistrationUseCase.execute(createRegistrationDto, userId);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters: {
      tournamentId?: string;
      teamId?: string;
      categoryId?: string;
      status?: string;
    },
  ) {
    return this.listRegistrationsUseCase.execute(paginationDto, filters);
  }

  async findOne(id: string) {
    return this.getRegistrationUseCase.execute(id);
  }

  async findRoster(id: string) {
    return this.getRegistrationRosterUseCase.execute(id);
  }

  async addRosterEntry(
    id: string,
    addRosterEntryDto: AddRegistrationRosterEntryDto,
    userId: string,
  ) {
    return this.addRegistrationRosterEntryUseCase.execute(
      id,
      addRosterEntryDto,
      userId,
    );
  }

  async approve(id: string, userId: string) {
    return this.approveRegistrationUseCase.execute(id, userId);
  }

  async reject(id: string, userId: string, rejectionReason?: string) {
    return this.rejectRegistrationUseCase.execute(id, userId, rejectionReason);
  }

  async remove(id: string) {
    return this.removeRegistrationUseCase.execute(id);
  }
}
