import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  AddPlayerBodyDto,
  CreateTeamBodyDto,
  UpdateTeamBodyDto,
} from './dto/team-request.dto';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(
    @Body() createTeamDto: CreateTeamBodyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.create(createTeamDto, userId);
  }

  @Get('mine')
  findMine(@CurrentUser('id') profileId: string) {
    return this.teamsService.findMine(profileId);
  }

  @Public()
  @Get()
  findAll(@Query() paginationDto: PaginationQueryDto) {
    return this.teamsService.findAll(paginationDto);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeamDto: UpdateTeamBodyDto,
  ) {
    // TODO: Verificar que el usuario es el creador del equipo o admin
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    // TODO: Verificar que el usuario es el creador del equipo o admin
    return this.teamsService.remove(id);
  }

  @Post(':id/players')
  addPlayer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addPlayerDto: AddPlayerBodyDto,
  ) {
    // TODO: Verificar que el usuario es el creador del equipo o admin
    return this.teamsService.addPlayer(id, addPlayerDto);
  }

  @Delete(':id/players/:profileId')
  removePlayer(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ) {
    // TODO: Verificar que el usuario es el creador del equipo o admin
    return this.teamsService.removePlayer(id, profileId);
  }

  @Patch(':id/captain/:profileId')
  assignCaptain(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ) {
    // TODO: Verificar que el usuario es el creador del equipo o admin
    return this.teamsService.assignCaptain(id, profileId);
  }
}
