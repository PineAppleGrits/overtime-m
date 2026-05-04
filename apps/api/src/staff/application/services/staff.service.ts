import { Injectable } from '@nestjs/common';
import { Modality, SportCode } from '../../../common/sport-rules/sport-rules.types';
import { CreateStaffUseCase } from '../use-cases/create-staff.use-case';
import { UpdateStaffUseCase } from '../use-cases/update-staff.use-case';
import { DeleteStaffUseCase } from '../use-cases/delete-staff.use-case';
import { GetStaffUseCase } from '../use-cases/get-staff.use-case';
import { SetAvailabilityUseCase } from '../use-cases/set-availability.use-case';
import { FindAvailableStaffUseCase } from '../use-cases/find-available-staff.use-case';
import { AssignToMatchUseCase } from '../use-cases/assign-to-match.use-case';
import { BatchAssignToMatchesUseCase } from '../use-cases/batch-assign-to-matches.use-case';
import { RemoveFromMatchUseCase } from '../use-cases/remove-from-match.use-case';
import { GetAssignedMatchesUseCase } from '../use-cases/get-assigned-matches.use-case';
import { ValidateMinStaffUseCase } from '../use-cases/validate-min-staff.use-case';
import { ComputeAjcFeeUseCase } from '../use-cases/compute-ajc-fee.use-case';
import { ApplyAjcUseCase } from '../use-cases/apply-ajc.use-case';
import { CreateMatchPhotoFolderUseCase } from '../use-cases/create-match-photo-folder.use-case';
import { ListStaffFilter } from '../ports/staff-repository.port';

/**
 * Facade público del módulo Staff. Se exporta a otras features (W3.1
 * match lifecycle) y se inyecta en el controller.
 *
 * Mantiene compatibilidad con la signature anterior (`StaffService.findAvailable`,
 * `assignToMatch`, etc.) para no romper callers que ya importen este servicio.
 */
@Injectable()
export class StaffService {
  constructor(
    private readonly createUC: CreateStaffUseCase,
    private readonly updateUC: UpdateStaffUseCase,
    private readonly deleteUC: DeleteStaffUseCase,
    private readonly getUC: GetStaffUseCase,
    private readonly setAvailUC: SetAvailabilityUseCase,
    private readonly findAvailUC: FindAvailableStaffUseCase,
    private readonly assignUC: AssignToMatchUseCase,
    private readonly batchAssignUC: BatchAssignToMatchesUseCase,
    private readonly removeUC: RemoveFromMatchUseCase,
    private readonly assignedMatchesUC: GetAssignedMatchesUseCase,
    private readonly validateMinStaffUC: ValidateMinStaffUseCase,
    private readonly computeAjcUC: ComputeAjcFeeUseCase,
    private readonly applyAjcUC: ApplyAjcUseCase,
    private readonly createPhotoFolderUC: CreateMatchPhotoFolderUseCase,
  ) {}

  // CRUD
  create(input: Parameters<CreateStaffUseCase['execute']>[0]) {
    return this.createUC.execute(input);
  }

  update(input: Parameters<UpdateStaffUseCase['execute']>[0]) {
    return this.updateUC.execute(input);
  }

  delete(id: string) {
    return this.deleteUC.execute(id);
  }

  findOne(id: string) {
    return this.getUC.findOne(id);
  }

  list(filter: ListStaffFilter) {
    return this.getUC.list(filter);
  }

  // Availability
  setAvailability(input: Parameters<SetAvailabilityUseCase['execute']>[0]) {
    return this.setAvailUC.execute(input);
  }

  findAvailable(input: Parameters<FindAvailableStaffUseCase['execute']>[0]) {
    return this.findAvailUC.execute(input);
  }

  // Match assignment (RN-050)
  assignToMatch(input: Parameters<AssignToMatchUseCase['execute']>[0]) {
    return this.assignUC.execute(input);
  }

  batchAssign(input: Parameters<BatchAssignToMatchesUseCase['execute']>[0]) {
    return this.batchAssignUC.execute(input);
  }

  removeFromMatch(input: Parameters<RemoveFromMatchUseCase['execute']>[0]) {
    return this.removeUC.execute(input);
  }

  getAssignedMatches(input: Parameters<GetAssignedMatchesUseCase['execute']>[0]) {
    return this.assignedMatchesUC.execute(input);
  }

  // RN-049 — staff mínimo (consumido por W3.1 al iniciar un partido)
  validateMatchStaffMinimum(
    matchId: string,
    sportCode: SportCode,
    modality: Modality,
  ) {
    return this.validateMinStaffUC.execute({ matchId, sportCode, modality });
  }

  // RN-030 — AJC
  computeAjcFee(input: Parameters<ComputeAjcFeeUseCase['execute']>[0]) {
    return this.computeAjcUC.execute(input);
  }

  applyAjc(input: Parameters<ApplyAjcUseCase['execute']>[0]) {
    return this.applyAjcUC.execute(input);
  }

  // RN-051 — Drive folder
  createMatchPhotoFolder(
    input: Parameters<CreateMatchPhotoFolderUseCase['execute']>[0],
  ) {
    return this.createPhotoFolderUC.execute(input);
  }
}
