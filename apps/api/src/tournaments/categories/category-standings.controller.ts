import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Public } from '../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

/**
 * Endpoints públicos de lectura sobre una categoría sin requerir el
 * `tournamentId` en la URL — pensados para consumo directo del FE.
 *
 * - `GET /categories/:categoryId/standings` → BE-MOCK-003 (tabla de posiciones).
 * - `GET /categories/:categoryId/fixture`   → BE-MOCK-002 (matches por ronda).
 */
@ApiTags('categories')
@Controller('categories')
export class CategoryStandingsController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get(':categoryId/standings')
  @ApiOperation({
    summary:
      'Tabla de posiciones de la categoría agrupada por zona. ' +
      'Computada on-the-fly desde matches finalizados de fase regular ' +
      '(matchType=regular). FIBA RN-018: PG=2pts, PP=1pt. ' +
      'Orden: puntos desc, DP desc, PF desc.',
  })
  getStandings(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.categoriesService.computeStandings(categoryId);
  }

  @Public()
  @Get(':categoryId/fixture')
  @ApiOperation({
    summary:
      'Fixture de fase regular agrupado por ronda. Sin Match.roundNumber ' +
      'en el schema, hoy se agrupa por día calendario (cada matchDate único ' +
      'es una ronda) y se nombran "Fecha N" en orden cronológico. Ver ' +
      'docs/be-proposals-mocks.md §BE-MOCK-002.',
  })
  getFixture(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.categoriesService.getFixture(categoryId);
  }
}
