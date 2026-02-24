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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, PaginationDto } from '@overtime-mono/shared';
import { Admin } from '../common/decorators/admin.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Admin()
  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('role') actorRole: string,
  ) {
    return this.usersService.create(createUserDto, actorRole);
  }

  @Admin()
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query() paginationDto?: PaginationDto,
  ) {
    return this.usersService.findAll(search, paginationDto);
  }

  @Admin()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Admin()
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('role') actorRole: string,
  ) {
    return this.usersService.update(id, updateUserDto, actorRole);
  }

  @Admin()
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('role') actorRole: string,
  ) {
    return this.usersService.remove(id, actorRole);
  }
}
