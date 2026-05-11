import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { CreateTeamBodyDto } from './dto/team-request.dto';
import { TeamsFacadeService } from './application/services/teams-facade.service';

@ApiTags('teams')
@Controller('tournaments/:tournamentId/teams')
export class TournamentTeamsController {
  constructor(private readonly teamsService: TeamsFacadeService) {}

  @Post()
  create(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Body() createTeamDto: CreateTeamBodyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.createForTournament(
      tournamentId,
      createTeamDto,
      userId,
    );
  }
}
