import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

/**
 * Endpoints publicos de lectura sobre una categoria sin requerir el
 * `tournamentId` en la URL, pensados para consumo directo del FE.
 *
 * - `GET /categories/:categoryId/standings` -> BE-MOCK-003.
 * - `GET /categories/:categoryId/fixture`   -> BE-MOCK-002.
 */
@ApiTags('categories')
@Controller('categories')
export class CategoryStandingsController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get(':categoryId/standings')
  @ApiOperation({
    summary:
      'Tabla de posiciones por zona computada desde matches regulares finalizados. ' +
      'Para publico devuelve 409 si el torneo aun no publico fixture.',
  })
  getStandings(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @CurrentUser() user?: { role?: string | null },
  ) {
    return this.categoriesService.computeStandings(categoryId, user?.role);
  }

  @Public()
  @Get(':categoryId/fixture')
  @ApiOperation({
    summary:
      'Fixture agrupado por ronda proxy usando el dia calendario. ' +
      'Para publico devuelve 409 si el torneo aun no publico fixture.',
  })
  getFixture(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @CurrentUser() user?: { role?: string | null },
  ) {
    return this.categoriesService.getFixture(categoryId, user?.role);
  }
}
