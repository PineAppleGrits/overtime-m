import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { GenerateBracketUseCase } from '../../application/use-cases/generate-bracket.use-case';
import { OverrideBracketSeriesUseCase } from '../../application/use-cases/override-bracket-series.use-case';
import { ResolveTiebreakerUseCase } from '../../application/use-cases/resolve-tiebreaker.use-case';
import { GeneratePromotionPlayoffUseCase } from '../../application/use-cases/generate-promotion-playoff.use-case';
import {
  GenerateBracketDto,
  GeneratePromotionDto,
  OverrideSeriesDto,
  ResolveTiebreakerDto,
} from '../dto/playoffs.dto';
import {
  IPlayoffRepository,
  PLAYOFF_REPOSITORY,
} from '../../application/ports/playoff-repository.port';
import { Inject } from '@nestjs/common';

@ApiTags('playoffs')
@Controller()
export class PlayoffsController {
  constructor(
    private readonly generate: GenerateBracketUseCase,
    private readonly override: OverrideBracketSeriesUseCase,
    private readonly tiebreaker: ResolveTiebreakerUseCase,
    private readonly promotion: GeneratePromotionPlayoffUseCase,
    @Inject(PLAYOFF_REPOSITORY)
    private readonly repo: IPlayoffRepository,
  ) {}

  @Post('categories/:categoryId/playoffs/generate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Generar bracket de playoffs (RN-045, RN-047). Pre: regular completa.',
  })
  generateBracket(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: GenerateBracketDto,
  ) {
    return this.generate.execute({
      categoryId,
      baseDate: dto.baseDate ? new Date(dto.baseDate) : undefined,
    });
  }

  @Public()
  @Get('categories/:categoryId/playoffs/bracket')
  @ApiOperation({ summary: 'Bracket completo (todas las series).' })
  async getBracket(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    const series = await this.repo.findSeriesByCategory(categoryId);
    return { categoryId, series };
  }

  @Public()
  @Get('playoff-series/:id')
  @ApiOperation({ summary: 'Detalle de una serie.' })
  async getSeries(@Param('id', ParseUUIDPipe) id: string) {
    return this.repo.findSeriesById(id);
  }

  @Patch('categories/:categoryId/playoffs/series/:seriesId')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Override manual de equipos en una serie (antes de iniciar playoffs).',
  })
  overrideSeries(
    @Param('seriesId', ParseUUIDPipe) seriesId: string,
    @Body() dto: OverrideSeriesDto,
  ) {
    return this.override.execute({
      seriesId,
      homeTeamId: dto.homeTeamId,
      awayTeamId: dto.awayTeamId,
    });
  }

  @Post('playoff-series/:id/resolve-tiebreaker')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Tiebreaker manual para BO1 0-0 (RN-024 administrativo).',
  })
  resolveTiebreaker(
    @Param('id', ParseUUIDPipe) seriesId: string,
    @Body() dto: ResolveTiebreakerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tiebreaker.execute({
      seriesId,
      winnerTeamId: dto.winnerTeamId,
      resolvedBy: userId,
    });
  }

  @Post('categories/:categoryId/promotion-playoff/generate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar repechaje (RN-058) entre último de superior y 2° de inferior.',
  })
  generatePromotion(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() _dto: GeneratePromotionDto,
  ) {
    return this.promotion.execute({ lowerCategoryId: categoryId });
  }
}
