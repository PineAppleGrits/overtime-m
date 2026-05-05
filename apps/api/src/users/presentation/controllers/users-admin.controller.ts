import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { UsersService } from '../../application/services/users.service';
import {
  AssignRoleBodyDto,
  PreCreateAccountBodyDto,
  VerifyDniBodyDto,
} from '../dto/users-request.dto';
import { toProfileResponseDto } from '../mappers/profile.mapper';

/**
 * Endpoints administrativos NUEVOS de W3.4 (DNI verify, role assign,
 * pre-create, active status). El controller "users.controller.ts" legacy
 * sigue manejando el CRUD básico de admin.
 */
@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersAdminController {
  constructor(private readonly users: UsersService) {}

  @Post(':id/verify-dni')
  @Roles('admin', 'master')
  @ApiOperation({
    summary: 'Verificar DNI (RN-034 / RN-035 / RN-036) — admin manual',
  })
  async verifyDni(
    @Param('id', ParseUUIDPipe) profileId: string,
    @Body() body: VerifyDniBodyDto,
    @CurrentUser('id') actorId: string,
  ) {
    const result = await this.users.verifyDocumentNumber({
      profileId,
      documentNumber: body.documentNumber,
      verifiedBy: actorId,
    });
    return {
      profile: toProfileResponseDto(result.profile),
      blacklisted: result.blacklisted,
      merged: result.merged,
      mergedFromProfileId: result.mergedFromProfileId ?? null,
    };
  }

  @Post(':id/role')
  @Roles('admin', 'master')
  @ApiOperation({
    summary: 'Asignar rol a un usuario existente (RN-057)',
  })
  async assignRole(
    @Param('id', ParseUUIDPipe) profileId: string,
    @Body() body: AssignRoleBodyDto,
    @CurrentUser('role') actorRole: string,
    @CurrentUser('id') actorId: string,
  ) {
    const profile = await this.users.changeRole({
      targetProfileId: profileId,
      newRole: body.role,
      actorRole,
      actorProfileId: actorId,
    });
    return toProfileResponseDto(profile);
  }

  @Post('pre-create')
  @Roles('admin', 'master')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Pre-crear cuenta con rol (RN-057 — variante cuenta pre-creada)',
  })
  async preCreate(
    @Body() body: PreCreateAccountBodyDto,
    @CurrentUser('role') actorRole: string,
  ) {
    const profile = await this.users.preCreate({
      email: body.email,
      role: body.role,
      name: body.name,
      actorRole,
    });
    return toProfileResponseDto(profile);
  }

  @Get(':id/status')
  @Roles('admin', 'master')
  @ApiOperation({
    summary: 'Estado activo/inactivo computado (RN-037)',
  })
  async getStatus(@Param('id', ParseUUIDPipe) profileId: string) {
    return this.users.getActiveStatus(profileId);
  }
}
