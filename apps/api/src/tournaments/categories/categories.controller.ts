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
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  PaginationDto,
} from '@overtime-mono/shared';
import { Admin } from '../../common/decorators/admin.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { GetPlayoffConfigUseCase } from './application/use-cases/get-playoff-config.use-case';
import { UpdatePlayoffConfigUseCase } from './application/use-cases/update-playoff-config.use-case';
import {
  UpdatePlayoffConfigInput,
  UpdatePlayoffConfigSchema,
} from './presentation/dto/playoff-config.schema';

@Controller('tournaments/:tournamentId/categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly getPlayoffConfig: GetPlayoffConfigUseCase,
    private readonly updatePlayoffConfig: UpdatePlayoffConfigUseCase,
  ) {}

  @Post()
  @Admin()
  create(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create({
      ...createCategoryDto,
      tournamentId,
    });
  }

  @Public()
  @Get()
  findAll(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.categoriesService.findAll(tournamentId, paginationDto);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  /**
   * GET /api/v1/tournaments/:tournamentId/categories/:id/playoff-config
   *
   * Devuelve la config de playoff actual + el default sugerido por el
   * deporte/modalidad si está vacía. Público — ayuda al admin/UI a
   * mostrar la config efectiva al organizar.
   */
  @Public()
  @Get(':id/playoff-config')
  getPlayoffConfigEndpoint(@Param('id', ParseUUIDPipe) id: string) {
    return this.getPlayoffConfig.execute(id);
  }

  /**
   * PATCH /api/v1/tournaments/:tournamentId/categories/:id/playoff-config
   *
   * Editar config de playoffs. RN-047 — solo se permite mientras
   * `substatus !== PLAYOFFS_FASE`.
   */
  @Patch(':id/playoff-config')
  @Admin()
  updatePlayoffConfigEndpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @ZodBody(UpdatePlayoffConfigSchema) body: UpdatePlayoffConfigInput,
  ) {
    return this.updatePlayoffConfig.execute(id, body);
  }

  @Patch(':id')
  @Admin()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Admin()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
