import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FixturesService } from './fixtures.service';
import {
  GeneratePlayoffsDto,
  UpdatePlayoffConfigDto,
  SeedingMethod,
} from './dto/generate-playoffs.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('fixtures')
@Controller('fixtures')
export class FixturesController {
  constructor(private readonly fixturesService: FixturesService) {}

  /**
   * Get standings for a category
   * GET /fixtures/categories/:categoryId/standings
   */
  @Public()
  @Get('categories/:categoryId/standings')
  async getStandings(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.fixturesService.getStandings(categoryId);
  }

  /**
   * Get playoff status for a category
   * GET /fixtures/categories/:categoryId/playoffs/status
   */
  @Public()
  @Get('categories/:categoryId/playoffs/status')
  async getPlayoffStatus(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.fixturesService.getPlayoffStatus(categoryId);
  }

  /**
   * Get playoff bracket for a category
   * GET /fixtures/categories/:categoryId/playoffs/bracket
   */
  @Public()
  @Get('categories/:categoryId/playoffs/bracket')
  async getPlayoffBracket(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.fixturesService.getPlayoffBracket(categoryId);
  }

  /**
   * Preview playoff seeds (without generating)
   * GET /fixtures/categories/:categoryId/playoffs/seeds/preview
   */
  @Public()
  @Get('categories/:categoryId/playoffs/seeds/preview')
  async previewPlayoffSeeds(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query('teamsPerZone') teamsPerZone?: string,
    @Query('seedingMethod') seedingMethod?: SeedingMethod,
  ) {
    return this.fixturesService.getPlayoffSeedsPreview(
      categoryId,
      teamsPerZone ? parseInt(teamsPerZone, 10) : undefined,
      seedingMethod,
    );
  }

  /**
   * Update playoff configuration
   * PUT /fixtures/categories/:categoryId/playoffs/config
   */
  @Put('categories/:categoryId/playoffs/config')
  @Roles('admin')
  async updatePlayoffConfig(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() config: UpdatePlayoffConfigDto,
  ) {
    return this.fixturesService.updatePlayoffConfig(categoryId, config);
  }

  /**
   * Mark regular phase as complete
   * POST /fixtures/categories/:categoryId/regular-phase/complete
   */
  @Post('categories/:categoryId/regular-phase/complete')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async completeRegularPhase(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.fixturesService.completeRegularPhase(categoryId);
  }

  /**
   * Generate playoffs for a category
   * POST /fixtures/categories/:categoryId/playoffs/generate
   */
  @Post('categories/:categoryId/playoffs/generate')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async generatePlayoffs(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: Omit<GeneratePlayoffsDto, 'categoryId'>,
  ) {
    return this.fixturesService.generatePlayoffs({
      ...dto,
      categoryId,
    });
  }

  /**
   * Reset/delete playoffs for a category
   * DELETE /fixtures/categories/:categoryId/playoffs
   */
  @Delete('categories/:categoryId/playoffs')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async resetPlayoffs(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.fixturesService.resetPlayoffs(categoryId);
  }

  /**
   * Notify that a playoff match has finished (to advance winners)
   * POST /fixtures/matches/:matchId/advance
   */
  @Post('matches/:matchId/advance')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async advanceWinner(@Param('matchId', ParseUUIDPipe) matchId: string) {
    return this.fixturesService.onPlayoffMatchFinished(matchId);
  }
}
