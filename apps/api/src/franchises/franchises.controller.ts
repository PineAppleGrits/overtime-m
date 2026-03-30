import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FranchisesService } from './franchises.service';
import { CreateFranchiseDto } from '@overtime-mono/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('franchises')
@ApiBearerAuth()
@Controller('franchises')
export class FranchisesController {
  constructor(private readonly franchisesService: FranchisesService) {}

  @Post()
  create(
    @Body() dto: CreateFranchiseDto,
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
