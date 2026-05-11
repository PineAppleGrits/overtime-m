import {
  Controller,
  Get,
  Post,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { FixturesService } from '../../application/services/fixtures.service';

@ApiTags('fixtures')
@Controller('fixtures')
export class FixturesController {
  constructor(private readonly fixturesService: FixturesService) {}

  @Public()
  @Get('categories/:categoryId/standings')
  async getStandings(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.fixturesService.getStandings(categoryId);
  }

  @Post('categories/:categoryId/regular-phase/complete')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark regular phase as complete' })
  async completeRegularPhase(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.fixturesService.completeRegularPhase(categoryId);
  }
}
