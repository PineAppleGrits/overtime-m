import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CategorySubstatus } from '@prisma/client';
import type {
  AddRegistrationRosterEntryDto,
  CreateRegistrationSchemaDto,
  PaginationDto,
} from '@overtime-mono/shared';
import {
  REGISTRATION_ELIGIBILITY_PORT,
  type RegistrationEligibilityPort,
} from '../ports/registration-eligibility.port';
import {
  REGISTRATION_EVENTS_PORT,
  type RegistrationEventsPort,
} from '../ports/registration-events.port';
import {
  REGISTRATION_REPOSITORY,
  type RegistrationDetailRecord,
  type RegistrationRepository,
} from '../ports/registration-repository.port';
import {
  REGISTRATION_ROSTER_CONTEXT_PORT,
  type RegistrationRosterContextPort,
} from '../ports/registration-roster-context.port';
import {
  EDITABLE_REGISTRATION_STATUSES,
  MAX_ADDITIONS,
  MAX_TOTAL_ROSTER,
  MIN_INITIAL_ROSTER,
  NON_FINISHED_MATCH_STATUSES,
  PLAYOFF_CUTOFF_REMAINING_MATCHES,
} from '../../registrations.constants';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    @Inject(REGISTRATION_REPOSITORY)
    private readonly repository: RegistrationRepository,
    @Inject(REGISTRATION_ROSTER_CONTEXT_PORT)
    private readonly rosterContext: RegistrationRosterContextPort,
    @Inject(REGISTRATION_ELIGIBILITY_PORT)
    private readonly eligibility: RegistrationEligibilityPort,
    @Inject(REGISTRATION_EVENTS_PORT)
    private readonly events: RegistrationEventsPort,
  ) {}

  private assertNoDuplicateProfileIds(profileIds: string[]): void {
    if (new Set(profileIds).size !== profileIds.length) {
      throw new BadRequestException('Roster cannot contain duplicated players');
    }
  }

  private assertInitialRosterSize(players: Array<unknown>): void {
    if (players.length < MIN_INITIAL_ROSTER) {
      throw new BadRequestException(
        `Initial roster must contain at least ${MIN_INITIAL_ROSTER} players`,
      );
    }

    if (players.length > MAX_TOTAL_ROSTER) {
      throw new BadRequestException(
        `Initial roster cannot contain more than ${MAX_TOTAL_ROSTER} players`,
      );
    }
  }

  private async assertProfilesCanJoinTournamentRoster(
    params: {
      profileIds: string[];
      tournamentId: string;
      categoryId: string;
      teamId: string;
      excludeRegistrationId?: string;
    },
  ): Promise<void> {
    const rosterEntries = await this.repository.findRosterConflicts({
      ...params,
    });

    for (const profileId of params.profileIds) {
      const profileEntries = rosterEntries.filter(
        (entry) => entry.profileId === profileId,
      );

      const teamIds = new Set(
        profileEntries.map((entry) => entry.registration.teamId),
      );

      if (teamIds.size >= 2) {
        throw new ConflictException(
          'A player cannot belong to more than 2 teams in the same tournament',
        );
      }

      const sameCategoryConflict = profileEntries.some(
        (entry) =>
          entry.registration.categoryId === params.categoryId &&
          entry.registration.teamId !== params.teamId,
      );

      if (sameCategoryConflict) {
        throw new ConflictException(
          'A player cannot belong to multiple teams in the same category of a tournament',
        );
      }
    }
  }

  private async getRemainingRegularMatchesCount(registration: {
    teamId: string;
    categoryId: string;
  }): Promise<number | null> {
    const totalScheduledMatches =
      await this.repository.countScheduledRegularMatches({
        teamId: registration.teamId,
        categoryId: registration.categoryId,
      });

    if (totalScheduledMatches === 0) {
      return null;
    }

    return this.repository.countRemainingRegularMatches({
      teamId: registration.teamId,
      categoryId: registration.categoryId,
      statuses: [...NON_FINISHED_MATCH_STATUSES],
    });
  }

  private async assertRosterAdditionWindow(registration: {
    teamId: string;
    categoryId: string;
    category: {
      substatus: CategorySubstatus | null;
    };
  }): Promise<void> {
    if (registration.category.substatus === CategorySubstatus.PLAYOFFS_FASE) {
      throw new BadRequestException(
        'Roster additions are closed because the category is already in playoffs',
      );
    }

    const remainingMatches =
      await this.getRemainingRegularMatchesCount(registration);

    if (remainingMatches === null) {
      return;
    }

    if (remainingMatches <= PLAYOFF_CUTOFF_REMAINING_MATCHES) {
      throw new BadRequestException(
        `Roster additions are closed when the team has ${PLAYOFF_CUTOFF_REMAINING_MATCHES} or fewer regular matches remaining`,
      );
    }
  }

  private async getRegistrationDetailOrThrow(
    id: string,
  ): Promise<RegistrationDetailRecord> {
    const registration = await this.repository.findDetailById(id);

    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }

    return registration;
  }

  async create(
    createRegistrationDto: CreateRegistrationSchemaDto,
    requestedBy: string,
  ) {
    this.assertInitialRosterSize(createRegistrationDto.initialRoster);

    const team = await this.repository.findTeamById(createRegistrationDto.teamId);

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const tournament = await this.repository.findTournamentById(
      createRegistrationDto.tournamentId,
    );

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.status !== 'OPEN') {
      throw new BadRequestException(
        `Tournament is not accepting registrations. Current status: ${tournament.status}`,
      );
    }

    const now = new Date();
    if (
      tournament.registrationStartDate &&
      tournament.registrationStartDate > now
    ) {
      throw new BadRequestException('Registration period has not started yet');
    }

    if (
      tournament.registrationEndDate &&
      tournament.registrationEndDate < now
    ) {
      throw new BadRequestException('Registration period has ended');
    }

    const category = await this.repository.findCategoryById(
      createRegistrationDto.categoryId,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.tournamentId !== createRegistrationDto.tournamentId) {
      throw new BadRequestException(
        'Category does not belong to the specified tournament',
      );
    }

    if (team.sportId !== category.tournament.sportId) {
      throw new BadRequestException('Team sport must match category sport');
    }

    await this.eligibility.assertTeamEligibleForRegistration({
      teamId: createRegistrationDto.teamId,
      tournamentId: createRegistrationDto.tournamentId,
      categoryId: createRegistrationDto.categoryId,
    });

    const existingRegistration =
      await this.repository.findExistingActiveRegistration(
        createRegistrationDto.teamId,
        createRegistrationDto.tournamentId,
      );

    if (existingRegistration) {
      if (
        existingRegistration.categoryId === createRegistrationDto.categoryId
      ) {
        throw new ConflictException(
          'Team is already registered in this category',
        );
      }

      throw new ConflictException(
        `Team is already registered in another category (${existingRegistration.categoryId}) of this tournament. A team can only be in one category per tournament.`,
      );
    }

    const resolvedPlayers = await this.rosterContext.resolvePlayers(
      createRegistrationDto.initialRoster,
    );

    this.assertNoDuplicateProfileIds(
      resolvedPlayers.map((player) => player.profileId),
    );

    await this.assertProfilesCanJoinTournamentRoster({
      profileIds: resolvedPlayers.map((player) => player.profileId),
      tournamentId: createRegistrationDto.tournamentId,
      categoryId: createRegistrationDto.categoryId,
      teamId: createRegistrationDto.teamId,
    });

    for (const player of resolvedPlayers) {
      await this.eligibility.assertProfileEligibleForRegistration({
        profileId: player.profileId,
        tournamentId: createRegistrationDto.tournamentId,
        categoryId: createRegistrationDto.categoryId,
      });
    }

    const registration = await this.repository.createPendingRegistration({
      teamId: createRegistrationDto.teamId,
      tournamentId: createRegistrationDto.tournamentId,
      categoryId: createRegistrationDto.categoryId,
      requestedBy,
      players: resolvedPlayers,
    });

    this.logger.log(
      `Registration created: Team ${team.name} -> Tournament ${tournament.name}, Category ${category.name}`,
    );

    return registration;
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
    return this.repository.list(paginationDto, filters);
  }

  async findOne(id: string) {
    return this.getRegistrationDetailOrThrow(id);
  }

  async findRoster(id: string) {
    const registration = await this.getRegistrationDetailOrThrow(id);

    return {
      data: registration.rosterEntries,
      meta: {
        total: registration.rosterEntries.length,
        initialCount: registration.rosterEntries.filter(
          (entry) => entry.type === 'INITIAL',
        ).length,
        additionsCount: registration.rosterEntries.filter(
          (entry) => entry.type === 'ADDITION',
        ).length,
      },
    };
  }

  async addRosterEntry(
    id: string,
    addRosterEntryDto: AddRegistrationRosterEntryDto,
    addedBy: string,
  ) {
    const registration = await this.repository.findEditableById(id);

    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }

    if (
      !EDITABLE_REGISTRATION_STATUSES.includes(
        registration.status as (typeof EDITABLE_REGISTRATION_STATUSES)[number],
      )
    ) {
      throw new BadRequestException(
        `Cannot edit roster for registration with status: ${registration.status}`,
      );
    }

    const currentTotal = registration.rosterEntries.length;
    const currentAdditions = registration.rosterEntries.filter(
      (entry) => entry.type === 'ADDITION',
    ).length;

    if (currentTotal >= MAX_TOTAL_ROSTER) {
      throw new BadRequestException(
        `Roster cannot contain more than ${MAX_TOTAL_ROSTER} players`,
      );
    }

    if (currentAdditions >= MAX_ADDITIONS) {
      throw new BadRequestException(
        `Roster cannot contain more than ${MAX_ADDITIONS} additions after registration`,
      );
    }

    await this.assertRosterAdditionWindow({
      teamId: registration.teamId,
      categoryId: registration.categoryId,
      category: registration.category,
    });

    const resolvedPlayers = await this.rosterContext.resolvePlayers([
      addRosterEntryDto,
    ]);

    if (
      registration.rosterEntries.some(
        (entry) => entry.profileId === resolvedPlayers[0].profileId,
      )
    ) {
      throw new ConflictException('Profile is already part of this roster');
    }

    await this.assertProfilesCanJoinTournamentRoster({
      profileIds: [resolvedPlayers[0].profileId],
      tournamentId: registration.tournamentId,
      categoryId: registration.categoryId,
      teamId: registration.teamId,
      excludeRegistrationId: registration.id,
    });

    await this.eligibility.assertTeamEligibleForRegistration({
      teamId: registration.teamId,
      tournamentId: registration.tournamentId,
      categoryId: registration.categoryId,
    });

    await this.eligibility.assertProfileEligibleForRegistration({
      profileId: resolvedPlayers[0].profileId,
      tournamentId: registration.tournamentId,
      categoryId: registration.categoryId,
    });

    await this.repository.addRosterEntry({
      registrationId: registration.id,
      teamId: registration.teamId,
      profileId: resolvedPlayers[0].profileId,
      addedBy,
    });

    this.logger.log(
      `Roster addition created for registration ${registration.id}: ${resolvedPlayers[0].profileId}`,
    );

    return this.getRegistrationDetailOrThrow(id);
  }

  async approve(id: string, approvedBy: string) {
    const registration = await this.findOne(id);

    if (registration.status !== 'pendiente') {
      throw new BadRequestException(
        `Cannot approve registration with status: ${registration.status}`,
      );
    }

    const updatedRegistration = await this.repository.approveRegistration(
      id,
      approvedBy,
    );

    this.logger.log(`Registration approved: ${id}`);

    this.events.emitApproved({
      registrationId: id,
      teamId: updatedRegistration.teamId,
      tournamentId: updatedRegistration.tournamentId,
      approvedBy,
    });

    return updatedRegistration;
  }

  async reject(id: string, approvedBy: string, rejectionReason?: string) {
    const registration = await this.findOne(id);

    if (registration.status !== 'pendiente') {
      throw new BadRequestException(
        `Cannot reject registration with status: ${registration.status}`,
      );
    }

    const updatedRegistration = await this.repository.rejectRegistration({
      id,
      approvedBy,
      rejectionReason: rejectionReason || 'Rejected by administrator',
    });

    this.logger.log(`Registration rejected: ${id}`);

    this.events.emitRejected({
      registrationId: id,
      teamId: updatedRegistration.teamId,
      tournamentId: updatedRegistration.tournamentId,
      rejectedBy: approvedBy,
      reason: rejectionReason ?? undefined,
    });

    return updatedRegistration;
  }

  async remove(id: string) {
    const registration = await this.findOne(id);

    if (
      registration.status === 'aprobada' ||
      registration.status === 'pagada'
    ) {
      throw new BadRequestException(
        'Cannot delete approved or paid registration',
      );
    }

    await this.repository.deleteRegistration(id);

    this.logger.log(`Registration deleted: ${id}`);

    return { message: 'Registration deleted successfully' };
  }
}
