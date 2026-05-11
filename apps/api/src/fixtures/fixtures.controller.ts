import {
  Controller,
  Get,
  Post,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FixturesService } from './application/services/fixtures.service';
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
}
