import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { CreateFranchiseBodyDto } from '../../dto/franchise-request.dto';
import { FranchisesService } from '../../franchises.service';

@ApiTags('franchises')
@ApiBearerAuth()
@Controller('franchises')
export class FranchisesController {
  constructor(private readonly franchisesService: FranchisesService) {}

  @Post()
  create(
    @Body() dto: CreateFranchiseBodyDto,
    @CurrentUser('id') ownerId: string,
  ) {
    return this.franchisesService.create(dto, ownerId);
  }

  @Get('mine')
  findMine(@CurrentUser('id') ownerId: string) {
    return this.franchisesService.findMine(ownerId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.franchisesService.findOne(id);
  }
}
