import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { GetSportRulesPublicUseCase } from '../../application/use-cases/get-sport-rules-public.use-case';

/**
 * Endpoint público que expone la vista `SportRulesPublic` del registry de
 * strategies. El FE lo usa para mostrar rosters/scoring/staff sin
 * hardcodearlos.
 *
 * Ruta: `/api/v1/sports/:sportIdOrCode/rules?modality=5v5`
 *   - Sin `modality`: devuelve todas las modalidades soportadas para el deporte.
 *   - Con `modality`: devuelve sólo esa modalidad.
 */
@ApiTags('sports')
@Controller('sports/:sportIdOrCode/rules')
export class SportRulesController {
  constructor(private readonly useCase: GetSportRulesPublicUseCase) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Obtener reglas públicas del deporte+modalidad (RN-043)',
  })
  get(
    @Param('sportIdOrCode') sportIdOrCode: string,
    @Query('modality') modality?: string,
  ) {
    return this.useCase.execute({
      sportIdOrCode,
      modality: modality?.trim() || undefined,
    });
  }
}
