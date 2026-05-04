import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoryLevelDto } from '@overtime-mono/shared';
import { Admin } from '../../../common/decorators/admin.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { CreateCategoryLevelUseCase } from '../../application/use-cases/create-category-level.use-case';
import { DeleteCategoryLevelUseCase } from '../../application/use-cases/delete-category-level.use-case';
import { ListCategoryLevelsUseCase } from '../../application/use-cases/list-category-levels.use-case';
import { UpdateCategoryLevelUseCase } from '../../application/use-cases/update-category-level.use-case';
import {
  CreateCategoryLevelBodyDto,
  UpdateCategoryLevelBodyDto,
} from '../dto/category-level-request.dto';
import { toCategoryLevelDto } from '../mappers/category-level.mapper';

@ApiTags('category-levels')
@Controller('sports/:sportId/category-levels')
export class CategoryLevelsController {
  constructor(
    private readonly createUseCase: CreateCategoryLevelUseCase,
    private readonly listUseCase: ListCategoryLevelsUseCase,
    private readonly updateUseCase: UpdateCategoryLevelUseCase,
    private readonly deleteUseCase: DeleteCategoryLevelUseCase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Lista los niveles globales del deporte (ordenados por rank ASC).',
  })
  async list(
    @Param('sportId', ParseUUIDPipe) sportId: string,
  ): Promise<CategoryLevelDto[]> {
    const levels = await this.listUseCase.execute(sportId);
    return levels.map(toCategoryLevelDto);
  }

  @Post()
  @Admin()
  @ApiOperation({ summary: 'Crea un nuevo nivel global. Solo admin/master.' })
  async create(
    @Param('sportId', ParseUUIDPipe) sportId: string,
    @Body() body: CreateCategoryLevelBodyDto,
  ): Promise<CategoryLevelDto> {
    const level = await this.createUseCase.execute({
      sportId,
      code: body.code,
      displayName: body.displayName,
      rank: body.rank,
    });
    return toCategoryLevelDto(level);
  }

  @Patch(':levelId')
  @Admin()
  @ApiOperation({
    summary: 'Actualiza un nivel global existente. Solo admin/master.',
  })
  async update(
    @Param('sportId', ParseUUIDPipe) _sportId: string,
    @Param('levelId', ParseUUIDPipe) levelId: string,
    @Body() body: UpdateCategoryLevelBodyDto,
  ): Promise<CategoryLevelDto> {
    const level = await this.updateUseCase.execute({
      id: levelId,
      code: body.code,
      displayName: body.displayName,
      rank: body.rank,
    });
    return toCategoryLevelDto(level);
  }

  @Delete(':levelId')
  @Admin()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Elimina un nivel global. Solo admin/master.',
  })
  async remove(
    @Param('sportId', ParseUUIDPipe) _sportId: string,
    @Param('levelId', ParseUUIDPipe) levelId: string,
  ): Promise<void> {
    await this.deleteUseCase.execute(levelId);
  }
}
