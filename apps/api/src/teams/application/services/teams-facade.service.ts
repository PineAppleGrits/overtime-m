import { Injectable } from '@nestjs/common';
import type {
  AddPlayerSchemaDto,
  CreateFranchiseSchemaDto,
  CreateTeamSchemaDto,
  PaginationSchemaDto,
  UpdateTeamSchemaDto,
} from '@overtime-mono/shared';
import type { Modality } from '../../../common/sport-rules/sport-rules.types';
import { AssignTeamCaptainUseCase } from '../use-cases/assign-team-captain.use-case';
import { CreateTeamForTournamentUseCase } from '../use-cases/create-team-for-tournament.use-case';
import { CreateTeamUseCase } from '../use-cases/create-team.use-case';
import { GetTeamBalanceUseCase } from '../use-cases/get-team-balance.use-case';
import { GetTeamMatchPreviewsUseCase } from '../use-cases/get-team-match-previews.use-case';
import { GetTeamRosterStatusUseCase } from '../use-cases/get-team-roster-status.use-case';
import { GetTeamUseCase } from '../use-cases/get-team.use-case';
import { ListMyTeamsUseCase } from '../use-cases/list-my-teams.use-case';
import { ListTeamsUseCase } from '../use-cases/list-teams.use-case';
import { ManageTeamRosterUseCase } from '../use-cases/manage-team-roster.use-case';
import { PromoteTeamToFranchiseUseCase } from '../use-cases/promote-team-to-franchise.use-case';
import { RemoveTeamUseCase } from '../use-cases/remove-team.use-case';
import { UpdateTeamUseCase } from '../use-cases/update-team.use-case';
import { UploadTeamLogoUseCase } from '../use-cases/upload-team-logo.use-case';

@Injectable()
export class TeamsFacadeService {
  constructor(
    private readonly createTeamUseCase: CreateTeamUseCase,
    private readonly createTeamForTournamentUseCase: CreateTeamForTournamentUseCase,
    private readonly listMyTeamsUseCase: ListMyTeamsUseCase,
    private readonly listTeamsUseCase: ListTeamsUseCase,
    private readonly getTeamUseCase: GetTeamUseCase,
    private readonly updateTeamUseCase: UpdateTeamUseCase,
    private readonly removeTeamUseCase: RemoveTeamUseCase,
    private readonly manageTeamRosterUseCase: ManageTeamRosterUseCase,
    private readonly assignTeamCaptainUseCase: AssignTeamCaptainUseCase,
    private readonly promoteTeamToFranchiseUseCase: PromoteTeamToFranchiseUseCase,
    private readonly getTeamRosterStatusUseCase: GetTeamRosterStatusUseCase,
    private readonly uploadTeamLogoUseCase: UploadTeamLogoUseCase,
    private readonly getTeamMatchPreviewsUseCase: GetTeamMatchPreviewsUseCase,
    private readonly getTeamBalanceUseCase: GetTeamBalanceUseCase,
  ) {}

  async create(createTeamDto: CreateTeamSchemaDto, creatorId: string) {
    return this.createTeamUseCase.execute(createTeamDto, creatorId);
  }

  async createForTournament(
    tournamentId: string,
    createTeamDto: CreateTeamSchemaDto,
    creatorId: string,
  ) {
    return this.createTeamForTournamentUseCase.execute(
      tournamentId,
      createTeamDto,
      creatorId,
    );
  }

  async findMine(profileId: string) {
    return this.listMyTeamsUseCase.execute(profileId);
  }

  async findAll(paginationDto: PaginationSchemaDto) {
    return this.listTeamsUseCase.execute(paginationDto);
  }

  async findOne(id: string) {
    return this.getTeamUseCase.execute(id);
  }

  async update(id: string, updateTeamDto: UpdateTeamSchemaDto) {
    return this.updateTeamUseCase.execute(id, updateTeamDto);
  }

  async remove(id: string) {
    return this.removeTeamUseCase.execute(id);
  }

  async addPlayer(teamId: string, addPlayerDto: AddPlayerSchemaDto) {
    return this.manageTeamRosterUseCase.addPlayer(teamId, addPlayerDto);
  }

  async removePlayer(teamId: string, profileId: string) {
    return this.manageTeamRosterUseCase.removePlayer(teamId, profileId);
  }

  async assignCaptain(teamId: string, profileId: string) {
    return this.assignTeamCaptainUseCase.execute(teamId, profileId);
  }

  async promoteToFranchise(
    teamId: string,
    dto: CreateFranchiseSchemaDto,
    ownerId: string,
  ) {
    return this.promoteTeamToFranchiseUseCase.execute(teamId, dto, ownerId);
  }

  async getRosterStatus(teamId: string, modality: Modality) {
    return this.getTeamRosterStatusUseCase.execute(teamId, modality);
  }

  async uploadLogo(
    teamId: string,
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ) {
    return this.uploadTeamLogoUseCase.execute(teamId, userId, file);
  }

  async findTeamMatches(teamId: string, type?: 'last' | 'next') {
    return this.getTeamMatchPreviewsUseCase.execute(teamId, type);
  }

  async getBalance(teamId: string, currentUserId: string, currentUserRole?: string | null) {
    return this.getTeamBalanceUseCase.execute(teamId, currentUserId, currentUserRole);
  }
}
