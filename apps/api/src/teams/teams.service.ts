import { Injectable } from '@nestjs/common';
import type {
  AddPlayerSchemaDto,
  CreateFranchiseSchemaDto,
  CreateTeamSchemaDto,
  PaginationSchemaDto,
  TeamRosterStatusDto,
  UpdateTeamSchemaDto,
} from '@overtime-mono/shared';
import type { Modality } from '../common/sport-rules/sport-rules.types';
import { TeamsService as ApplicationTeamsService } from './application/services/teams.service';

@Injectable()
export class TeamsService {
  constructor(private readonly service: ApplicationTeamsService) {}

  async create(createTeamDto: CreateTeamSchemaDto, creatorId: string) {
    return this.service.create(createTeamDto, creatorId);
  }

  async createForTournament(
    tournamentId: string,
    createTeamDto: CreateTeamSchemaDto,
    creatorId: string,
  ) {
    return this.service.createForTournament(tournamentId, createTeamDto, creatorId);
  }

  async findMine(profileId: string) {
    return this.service.findMine(profileId);
  }

  async findAll(paginationDto: PaginationSchemaDto) {
    return this.service.findAll(paginationDto);
  }

  async findOne(id: string) {
    return this.service.findOne(id);
  }

  async update(id: string, updateTeamDto: UpdateTeamSchemaDto) {
    return this.service.update(id, updateTeamDto);
  }

  async remove(id: string) {
    return this.service.remove(id);
  }

  async addPlayer(teamId: string, addPlayerDto: AddPlayerSchemaDto) {
    return this.service.addPlayer(teamId, addPlayerDto);
  }

  async removePlayer(teamId: string, profileId: string) {
    return this.service.removePlayer(teamId, profileId);
  }

  async assignCaptain(teamId: string, profileId: string) {
    return this.service.assignCaptain(teamId, profileId);
  }

  async promoteToFranchise(
    teamId: string,
    dto: CreateFranchiseSchemaDto,
    ownerId: string,
  ) {
    return this.service.promoteToFranchise(teamId, dto, ownerId);
  }

  async getRosterStatus(
    teamId: string,
    modality: Modality,
  ): Promise<TeamRosterStatusDto> {
    return this.service.getRosterStatus(teamId, modality);
  }

  async uploadLogo(
    teamId: string,
    uploaderId: string,
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
    },
  ) {
    return this.service.uploadLogo(teamId, uploaderId, file);
  }

  async findTeamMatches(teamId: string, type?: 'last' | 'next') {
    return this.service.findTeamMatches(teamId, type);
  }

  async getBalance(
    teamId: string,
    currentUserId: string,
    currentUserRole: string | null | undefined,
  ) {
    return this.service.getBalance(teamId, currentUserId, currentUserRole);
  }
}
